import React from "react";
import { Nav, Col, Row } from "react-bootstrap";
import TicketListItem from "./TicketListItem";
import { status, ITicketHeadData} from "../typeLib";

type ListProps = {
    headerData: ITicketHeadData[];
    selectedId: string;
    selectedTab: number;
    onClick: (id: string) => void;
    emitStatus: (id: string, status: status) => void;
    tabSwitchCallback: (tab: number) => void;
}

//Component rendering a single list item in the ticketlist
const TicketList: React.FC<ListProps> = ({headerData, selectedTab, selectedId, onClick, emitStatus, tabSwitchCallback}) => {
  
  return (
    <Col md={3} className='small p-1 bg-body'>
      <Nav variant="tabs" activeKey={selectedTab}>
        <Nav.Item>
          <Nav.Link eventKey={0} onClick={() => tabSwitchCallback(0)}>Queue</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={1} onClick={() => tabSwitchCallback(1)}>My tickets</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={2} onClick={() => tabSwitchCallback(2)}>Completed</Nav.Link>
        </Nav.Item>
      </Nav>
          <Row className='m-1 border-bottom'>
            <Col xs={6}>Subject</Col><Col xs={3}>Created</Col><Col xs={3}>Last</Col>
          </Row>
          {headerData && selectedTab === 0 ? 
            headerData!.map((data) => data.admin === "" ? <TicketListItem data={data} selectedId={selectedId} openTab={0} onClick={onClick} emitStatus={emitStatus} key={data.date}/> : null) : null}
          {headerData && selectedTab === 1 ? 
            headerData!.map((data) => data.admin != "" && data.status != status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} openTab={1} onClick={onClick} emitStatus={emitStatus} key={data.date}/> : null) : null}
          {headerData && selectedTab === 2 ? 
            headerData!.map((data) => data.admin != "" && data.status === status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} openTab={2} onClick={onClick} emitStatus={emitStatus} key={data.date}/> : null) : null}
      </Col>
  );
}

export default TicketList;