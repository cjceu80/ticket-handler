import React, { useEffect, useState } from "react";
import {Socket} from 'socket.io-client';
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { ITicketDetailData, ITicketHeadData, IServerToClientEvents, IClientToServerEvents, status  } from "../typeLib";
import TicketMessage from "./TicketMessage";

type TicketBodyProps = {
  id: string;
  headData: ITicketHeadData | undefined;
  socket: Socket<IServerToClientEvents, IClientToServerEvents>;
}

//Render the body where messages are handled.
const TicketBody: React.FC<TicketBodyProps> = ({headData, id, socket}) => {
  const [detailedData, setDetailedData] = useState<ITicketDetailData>({_id: "", messages: []});
  const [lastId, setLastID] = useState<string>("");
  const [formText, setFormText] = useState<string>("");

  //Triggers hook to reload when selected item is changed.    qq<Might be redundant later>
  if (id != lastId){
    setLastID(id);}

  //Loads ticket details and changes status when unread is view.
  useEffect(() => {
      socket.emit('details', id, (data) => {
        setDetailedData(data);
        
        //Pushes change to status when unread in viewed.
        if (headData!.status == status.USER_NEW){
          headData!.status = status.ACTIVE;
          socket.emit('pushStatus', {id: id, status: status.ACTIVE});
        }}
      )
  },[lastId, headData, id, socket])


  //Pushes a new message and gets a reload with updated data.
  async function handleSubmit() {
    await socket.emit('pushMessage', {id: id, message: formText}, (data)=>{console.log(data);setDetailedData(data);});
    setFormText("");
  }

  return(
    <Container>
      <Row className="mt-4">
        <Col className="d-flex justify-content-center">
          <h3>{headData!.subject != undefined ? headData!.subject : "No subject submitted."}</h3>
        </Col>
      </Row>
      {detailedData.messages.map((element, index) => <TicketMessage key={new Date(element.date).toISOString()+index} message={element}/>)}
      <Row>
        <Col xs={2}></Col>
        <Col sx={10}>
          <Card hidden={headData?.status == status.RESOLVED}>
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