import React, {useState} from "react";
import { Nav, Col, Row } from "react-bootstrap";
import TicketListItem from "./TicketListItem";
import { status, ITicketHeadData} from "../typeLib";

type ListItemProps = {
    headerData: ITicketHeadData[];
    selectedId: string;
    onClick: (id: string) => void;
}

//Component rendering a single list item in the ticketlist
const TicketList: React.FC<ListItemProps> = ({headerData, selectedId, onClick}) => {
  const [selectedTab, setSelectedTab] = useState(0);


  return (
    <Col md={3}  className='small p-1 bg-body'>
      <Nav variant="tabs" activeKey={selectedTab}>
        <Nav.Item>
          <Nav.Link eventKey={0} onClick={() => setSelectedTab(0)}>Queue</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={1} onClick={() => setSelectedTab(1)}>My tickets</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey={2} onClick={() => setSelectedTab(2)}>Completed</Nav.Link>
        </Nav.Item>
      </Nav>
          <Row className='m-1 border-bottom'>
            <Col xs={6}>Subject</Col><Col xs={3}>Created</Col><Col xs={3}>Last</Col>
          </Row>
          {headerData && selectedTab === 0 ? 
            headerData!.map((data) => data.admin === "" ? <TicketListItem data={data} selectedId={selectedId} onClick={onClick} key={data.date}/> : null) : null}
          {headerData && selectedTab === 1 ? 
            headerData!.map((data) => data.admin != "" && data.status != status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} onClick={onClick} key={data.date}/> : null) : null}
          {headerData && selectedTab === 2 ? 
            headerData!.map((data) => data.admin != "" && data.status === status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} onClick={onClick} key={data.date}/> : null) : null}
      </Col>
  );
}

export default TicketList;