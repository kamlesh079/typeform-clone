from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class OptionIn(BaseModel):
    label: str = Field(min_length=1, max_length=300)


class QuestionIn(BaseModel):
    title: str = Field(min_length=1)
    description: str | None = None
    type: str = "short_text"
    required: bool = False
    options: list[OptionIn] = []


class FormCreate(BaseModel):
    title: str = "Untitled form"


class FormUpdate(BaseModel):
    title: str | None = None
    theme: str | None = None
    thank_you_title: str | None = None
    thank_you_message: str | None = None


class AnswerIn(BaseModel):
    question_id: int
    value: str


class SubmitResponse(BaseModel):
    answers: list[AnswerIn]


class OptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    position: int


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    type: str
    required: bool
    position: int
    options: list[OptionOut]


class FormOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    status: str
    theme: str
    thank_you_title: str
    thank_you_message: str
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut] = []
    response_count: int = 0
