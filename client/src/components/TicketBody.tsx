import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { ITicketDetailData, ITicketHeadData, status  } from "../typeLib";
import TicketMessage from "./TicketMessage";

type TTicketBodyProps = {
  id: string;
  data: ITicketHeadData | undefined;  
  callback: () => void;
}

//Render the body where messages are handled.
  const TicketBody: React.FC<TTicketBodyProps> = ({data, id, callback}) => {
  const [detailedData, setDetailedData] = useState<ITicketDetailData>({_id: "", messages: []});
  const [lastId, setLastID] = useState<string>("");
  const [formText, setFormText] = useState<string>("");

  //Triggers hook to reload when selected item is changed.    qq<Might be redundant later>
  if (id != lastId){
    setLastID(id);}

  //Loads ticket details and changes status when unread is view.
  useEffect(() => {
    if (!sessionStorage.getItem('token')){
      return;}

    //Attempt to fetch details
    fetch(`${import.meta.env.VITE_SERVER}/details/${id}`, {
      method: 'get',
      headers: {
          authorization: `bearer ${sessionStorage.getItem('token')}`
      },

    })
    .then(response => { 
      //If responce isn't a success the client is most likely timed out and will hence remove the token to trigger the login modal
      if (response.status != 200)
        sessionStorage.removeItem('token');
      return response.json()})
    .then(data => setDetailedData(data))
    
  }, [lastId, data, id])


  //Pushes a new message and gets a reload with updated data.
  async function handleSubmit() {

    fetch(`${import.meta.env.VITE_SERVER}/details/${id}`, {
      method: 'post',
      headers: {
          authorization: `bearer ${sessionStorage.getItem('token')}`,
          'content-type': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        message: formText
    })
    })
    .then(response => response.json())
    .then(data => setDetailedData(data))
    .then(() => callback());
    setFormText("");
    
  }

  return(
    <Container>
      <Row className="mt-4">
        <Col className="d-flex justify-content-center">
          <h3>{data!.subject != undefined ? data!.subject : "No subject submitted."}</h3>
        </Col>
      </Row>
      {detailedData.messages.map((element, index) => <TicketMessage key={new Date(element.date).toISOString()+index} message={element}/>)}
      <Row>
        <Col xs={2}></Col>
        <Col sx={10}>
          <Card hidden={data?.status == status.RESOLVED}>
            <Card.Header className="d-flex justify-content-between"><small>Enter response:</small></Card.Header>
            <Card.Body>
              <Form>
                <Form.Control as="textarea" rows={5} value={formText} onChange={(e) => setFormText(e.target.value)}/>
                <Button role="submit" onClick={() => handleSubmit()} disabled={formText == ""}>Submit</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TicketBody;