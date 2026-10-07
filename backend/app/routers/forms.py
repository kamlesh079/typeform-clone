import re
from collections import Counter
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload
from app.core.database import get_db
from app.models import Answer, Form, Question, QuestionOption, Response
from app.schemas.forms import FormCreate, FormOut, FormUpdate, QuestionIn, QuestionOut, SubmitResponse

router = APIRouter(prefix="/api", tags=["forms"])
VALID_TYPES = {"short_text", "long_text", "multiple_choice", "dropdown", "email", "number", "yes_no", "rating"}


def slugify(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "form"
    return f"{base}-{uuid4().hex[:6]}"


def form_or_404(db: Session, form_id: int) -> Form:
    form = db.scalar(select(Form).options(selectinload(Form.questions).selectinload(Question.options)).where(Form.id == form_id))
    if not form:
        raise HTTPException(404, "Form not found")
    return form


def output(form: Form) -> dict:
    data = FormOut.model_validate(form).model_dump()
    data["response_count"] = len(form.responses) if "responses" in form.__dict__ else 0
    return data


@router.get("/forms")
def list_forms(db: Session = Depends(get_db)):
    forms = db.scalars(select(Form).options(selectinload(Form.questions), selectinload(Form.responses)).order_by(Form.updated_at.desc())).all()
    return [output(form) for form in forms]


@router.post("/forms", status_code=status.HTTP_201_CREATED)
def create_form(payload: FormCreate, db: Session = Depends(get_db)):
    form = Form(title=payload.title.strip() or "Untitled form", slug=slugify(payload.title))
    db.add(form); db.commit(); db.refresh(form)
    return output(form)


@router.get("/forms/{form_id}")
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id)
    return output(form)


@router.patch("/forms/{form_id}")
def update_form(form_id: int, payload: FormUpdate, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id)
    for key, value in payload.model_dump(exclude_none=True).items(): setattr(form, key, value)
    db.commit(); db.refresh(form)
    return output(form)


@router.delete("/forms/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    db.delete(form_or_404(db, form_id)); db.commit()


@router.post("/forms/{form_id}/duplicate", status_code=201)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    source = form_or_404(db, form_id)
    copy = Form(title=f"{source.title} (copy)", slug=slugify(source.title), theme=source.theme, thank_you_title=source.thank_you_title, thank_you_message=source.thank_you_message)
    for q in source.questions:
        new_q = Question(title=q.title, description=q.description, type=q.type, required=q.required, position=q.position)
        new_q.options = [QuestionOption(label=o.label, position=o.position) for o in q.options]
        copy.questions.append(new_q)
    db.add(copy); db.commit(); db.refresh(copy)
    return output(copy)


@router.post("/forms/{form_id}/publish")
def publish(form_id: int, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id); form.status = "published"; db.commit(); db.refresh(form)
    return output(form)


@router.post("/forms/{form_id}/unpublish")
def unpublish(form_id: int, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id); form.status = "draft"; db.commit(); db.refresh(form)
    return output(form)


@router.post("/forms/{form_id}/questions", status_code=201)
def add_question(form_id: int, payload: QuestionIn, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id)
    if payload.type not in VALID_TYPES: raise HTTPException(422, "Unsupported question type")
    question = Question(form_id=form.id, title=payload.title, description=payload.description, type=payload.type, required=payload.required, position=len(form.questions))
    question.options = [QuestionOption(label=o.label, position=i) for i, o in enumerate(payload.options)]
    db.add(question); db.commit(); db.refresh(question)
    return QuestionOut.model_validate(question)


@router.patch("/questions/{question_id}")
def update_question(question_id: int, payload: QuestionIn, db: Session = Depends(get_db)):
    q = db.scalar(select(Question).options(selectinload(Question.options)).where(Question.id == question_id))
    if not q: raise HTTPException(404, "Question not found")
    if payload.type not in VALID_TYPES: raise HTTPException(422, "Unsupported question type")
    q.title, q.description, q.type, q.required = payload.title, payload.description, payload.type, payload.required
    q.options.clear(); q.options = [QuestionOption(label=o.label, position=i) for i, o in enumerate(payload.options)]
    db.commit(); db.refresh(q)
    return QuestionOut.model_validate(q)


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    q = db.get(Question, question_id)
    if not q: raise HTTPException(404, "Question not found")
    db.delete(q); db.commit()


@router.put("/forms/{form_id}/questions/reorder")
def reorder_questions(form_id: int, question_ids: list[int], db: Session = Depends(get_db)):
    form = form_or_404(db, form_id); actual = {q.id for q in form.questions}
    if set(question_ids) != actual: raise HTTPException(422, "Question IDs do not match this form")
    for index, qid in enumerate(question_ids): db.get(Question, qid).position = index
    db.commit(); return {"ok": True}


@router.get("/public/forms/{slug}")
def public_form(slug: str, db: Session = Depends(get_db)):
    form = db.scalar(select(Form).options(selectinload(Form.questions).selectinload(Question.options)).where(Form.slug == slug, Form.status == "published"))
    if not form: raise HTTPException(404, "Published form not found")
    return output(form)


@router.post("/public/forms/{slug}/responses", status_code=201)
def submit_response(slug: str, payload: SubmitResponse, db: Session = Depends(get_db)):
    form = db.scalar(select(Form).options(selectinload(Form.questions).selectinload(Question.options)).where(Form.slug == slug, Form.status == "published"))
    if not form: raise HTTPException(404, "Published form not found")
    values = {a.question_id: a.value.strip() for a in payload.answers}
    for q in form.questions:
        value = values.get(q.id, "")
        if q.required and not value: raise HTTPException(422, f"{q.title} is required")
        if q.type == "email" and value and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value): raise HTTPException(422, f"{q.title} must be an email")
        if q.type == "number" and value:
            try: float(value)
            except ValueError: raise HTTPException(422, f"{q.title} must be a number")
        if q.type == "rating" and value:
            try: rating = int(value)
            except ValueError: raise HTTPException(422, f"{q.title} must be a rating from 1 to 5")
            if rating < 1 or rating > 5: raise HTTPException(422, f"{q.title} must be a rating from 1 to 5")
        if q.type in {"multiple_choice", "dropdown", "yes_no"} and value and value not in [o.label for o in q.options]: raise HTTPException(422, f"Invalid option for {q.title}")
    response = Response(form_id=form.id)
    response.answers = [Answer(question_id=q.id, value=values[q.id]) for q in form.questions if values.get(q.id, "")]
    db.add(response); db.commit(); db.refresh(response)
    return {"id": response.id, "message": "Response saved"}


@router.get("/forms/{form_id}/results")
def results(form_id: int, db: Session = Depends(get_db)):
    form = form_or_404(db, form_id)
    responses = db.scalars(select(Response).options(selectinload(Response.answers)).where(Response.form_id == form.id).order_by(Response.submitted_at.desc())).all()
    output_rows = [{"id": r.id, "submitted_at": r.submitted_at, "answers": {a.question_id: a.value for a in r.answers}} for r in responses]
    stats = {}
    for q in form.questions:
        if q.type in {"multiple_choice", "dropdown", "yes_no"}:
            stats[q.id] = dict(Counter(row["answers"].get(q.id) for row in output_rows if row["answers"].get(q.id)))
    return {"form": output(form), "responses": output_rows, "stats": stats}
