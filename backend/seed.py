from app.core.database import Base, SessionLocal, engine
from app.models import Answer, Form, Question, QuestionOption, Response

Base.metadata.drop_all(engine); Base.metadata.create_all(engine)
db = SessionLocal()
feedback = Form(title="Product feedback", slug="product-feedback", status="published", thank_you_title="Thank you!", thank_you_message="Your feedback helps us improve.")
q1 = Question(title="What should we call you?", type="short_text", required=True, position=0)
q2 = Question(title="How would you rate your experience?", type="rating", required=True, position=1)
q3 = Question(title="What did you enjoy most?", type="multiple_choice", position=2)
q3.options = [QuestionOption(label=x, position=i) for i, x in enumerate(["Speed", "Design", "Support", "Features"])]
q4 = Question(title="Anything else to share?", type="long_text", position=3)
feedback.questions = [q1, q2, q3, q4]
application = Form(title="Workshop application", slug="workshop-application", status="published")
application.questions = [Question(title="Your email address", type="email", required=True, position=0), Question(title="Will you attend?", type="yes_no", required=True, position=1, options=[QuestionOption(label="Yes", position=0), QuestionOption(label="No", position=1)])]
db.add_all([feedback, application]); db.commit()
db.add_all([Response(form_id=feedback.id, answers=[Answer(question_id=q1.id, value="Ava"), Answer(question_id=q2.id, value="5"), Answer(question_id=q3.id, value="Design")]), Response(form_id=feedback.id, answers=[Answer(question_id=q1.id, value="Noah"), Answer(question_id=q2.id, value="4"), Answer(question_id=q3.id, value="Speed")])])
db.commit(); db.close()
print("Seeded product-feedback and workshop-application")
