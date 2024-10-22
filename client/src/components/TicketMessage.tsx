import React from "react";
import { Card, CardBody, Col, Row } from "react-bootstrap";
import { IMessage } from "../typeLib";

type TTicketMessageProps = {
    message: IMessage;
}

//Component rendering a single message
const TicketMessage: React.FC<TTicketMessageProps> = ({message}) => {

    return(
      <Row>
        {message.sender == sessionStorage.getItem('id') ? <Col xs={2}></Col> : null}
        <Col sx={10}>
          <Card>
            <Card.Header className="d-flex justify-content-between">
              <small>
                {sessionStorage.getItem('id') == message.sender ? sessionStorage.getItem('name') : message.sender}
              </small>
              <small>
                {new Date(message.date).toLocaleString('en', {timeZone: import.meta.env.VITE_TZ})}
              </small>
            </Card.Header>
            <CardBody>{message.message}</CardBody>
          </Card>
        </Col>
        {message.sender != sessionStorage.getItem('id') ? <Col xs={2}></Col> : null}
      </Row>
    )
}

export default TicketMessage;