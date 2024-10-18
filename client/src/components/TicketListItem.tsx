import React from "react";
import { Col, Row } from "react-bootstrap";

import { status, ITicketHeadData} from "../typeLib";
import new_message_img from "../assets/new_message.svg"

type TListItemProps = {
    data: ITicketHeadData;
    selectedId: string;
    onClick: (id: string) => void;
}

//Component rendering a single list item in the ticketlist
const TicketListItem: React.FC<TListItemProps> = ({data, selectedId, onClick}) => {

    //When clicked an unread message, this post the change of status
    async function sendStatus(newStatus: status) {
        data!.status = newStatus;
        await fetch(`${import.meta.env.VITE_SERVER}/status/${data!._id}`, {
            method: 'post',
            headers: {
                authorization: `bearer ${sessionStorage.getItem('token')}`,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
              status: newStatus,
          })
          });
    }
    
    //Handles the onClick on the tickets list entry
    function handleClick() {
        //Even though the status change is pushed in parent, this will make the visual change without doing a reload. 
        if (data!.status == status.USER_NEW)
            sendStatus(status.ACTIVE);
        else if (data!.status == status.USER_RESOLVED)
            sendStatus(status.RESOLVED);

        //For de-selecting the listitem when clicked again
        if (selectedId == data._id)
            onClick("");
        else
            onClick(data._id)
    }
    return(
        <Row className={`m-1 ${data._id == selectedId ? "bg-light" : null}`} onClick={() => handleClick()}>
            <Col>
            {data.subject} {data.status == status.USER_NEW || data.status == status.USER_RESOLVED ? <img src={new_message_img} width={10}/> : null}
            </Col>
            <Col>
                {new Date(data.date).toDateString()}
            </Col>
            <Col>
                {new Date(data.last_event).toDateString()}
            </Col>
        </Row>
    )
}

export default TicketListItem;