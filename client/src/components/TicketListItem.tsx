import React from "react";
import { Col, Row } from "react-bootstrap";

import { status, ITicketHeadData} from "../typeLib";
import new_message_img from "../assets/new_message.svg"

type ListItemProps = {
    data: ITicketHeadData;
    selectedId: string;
    onClick: (id: string) => void;
}

//Component rendering a single list item in the ticketlist
const TicketListItem: React.FC<ListItemProps> = ({data, selectedId, onClick}) => {
    
    //Handles the onClick on the tickets list entry
    function handleClick() {
        //Even though the status change is pushed in parent, this will make the visual change without doing a reload. 
        if (data!.status == status.USER_NEW)
            data!.status = status.ACTIVE;

        //For de-selecting the listitem when clicked again
        if (selectedId == data.id)
            onClick("");
        else
            onClick(data.id)
    }
    return(
        <Row className={`m-1 ${data.id == selectedId ? "bg-light" : null}`} onClick={() => handleClick()}>
            <Col>
            {data.subject} {data.status == status.USER_NEW ? <img src={new_message_img} width={10}/> : null}
            </Col>
            <Col>
                {new Date(data.date).toDateString()}
            </Col>
            <Col>
                {new Date(data.date).toDateString()}
            </Col>
        </Row>
    )
}

export default TicketListItem;