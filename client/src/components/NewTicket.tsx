import React, { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";


type TNewTicketProps = {
  callback: (id: string) => void
}

const NewTicket: React.FC<TNewTicketProps> = ({callback}) => {
  const [subjectText, setSubjectText] = useState('');
  const [formText, setFormText] = useState('');


  function handleSubmit() {
    fetch(`${import.meta.env.VITE_SERVER}/message`, {
      method: 'post',
      headers: {
          authorization: `bearer ${sessionStorage.getItem('token')}`,
          'content-type': 'application/json'
      },
      body: JSON.stringify({
        subject: subjectText != "" ? subjectText : "<no caption>",
        message: formText
    })
    })
    .then(response => response.json())
    .then(data => callback(data.data));
  }

  return (
    <Container>
      <Form>
        <Form.Label>Subject</Form.Label>
        <Form.Control type="text" placeholder="Subject" value={subjectText} onChange={(e) => setSubjectText(e.target.value)}/>
        <Form.Label>Describe your issue</Form.Label>
        <Form.Control as="textarea" rows={5} value={formText} onChange={(e) => setFormText(e.target.value)}/>
        <Button role="submit" onClick={() => handleSubmit()} disabled={formText == ""}>Submit</Button>
      </Form>
    </Container>
  );
}

export default NewTicket;