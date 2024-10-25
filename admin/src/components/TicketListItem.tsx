import React from "react";
import { Col, Row } from "react-bootstrap";

import { status, ITicketHeadData} from "../typeLib";
import new_message_img from "../assets/new_message.svg"

type ListItemProps = {
    data: ITicketHeadData;
    selectedId: string;
    openTab: number;
    onClick: (id: string) => void;
    emitStatus: (id: string, status: status) => void;
}

//Component rendering a single list item in the ticketlist
const TicketListItem: React.FC<ListItemProps> = ({data, selectedId, openTab, onClick, emitStatus}) => {
    
    //Handles the onClick on the tickets list entry
    function handleClick() {
        //pushes status change if needed. 
        if (data!.status == status.ADMIN_NEW){
            data!.status = status.ACTIVE;
            emitStatus(data._id, status.ACTIVE);
        }
            onClick(data._id)
    }

    return(
        <Row className={`m-1 ${data._id == selectedId ? "bg-light" : null}`} onClick={() => handleClick()}>
            <Col xs={6}>
            {data.subject} {data.status == status.ADMIN_NEW && openTab === 1? <img src={new_message_img} width={10}/> : null}
            </Col>
            <Col xs={3}>
                {new Date(data.date).toLocaleDateString()}
            </Col>
            <Col xs={3}>
                {new Date(data.date).toLocaleDateString()}
            </Col>
        </Row>
    )
}

export default TicketListItem;