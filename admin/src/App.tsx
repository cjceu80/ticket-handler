import { useEffect, useState } from 'react'
import { Row, Container, Col, Nav } from 'react-bootstrap';
import {io, Socket} from 'socket.io-client';
import Login from './components/Login'
import Header from './components/Header';
import TicketListItem from './components/TicketListItem';
import TicketBody from './components/TicketBody';
import { ITicketHeadData, IServerToClientEvents, IClientToServerEvents, status } from './typeLib';



const socket: Socket<IServerToClientEvents, IClientToServerEvents> = io(`${import.meta.env.VITE_SERVER}`, {
  extraHeaders: {
      authorization: `bearer ${sessionStorage.getItem('token')}`
  },
  reconnectionAttempts: 1
});

export default function App() {
  const [isLoged, setIsLoged] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [headerData, setHeaderData] = useState<ITicketHeadData[]>();
  const [userHeaderData, setUserHeaderData] = useState<ITicketHeadData[]>();
  const [selectedTab, setSelectedTab] = useState(0);

  //Loading headers on socket connect.
  useEffect(() => {
    socket.on('connect', () => {
      console.log("connected");
      setIsLoged(true);
      socket.emit('headers', 'unassigned', (data) => {setHeaderData(data)});
      socket.emit('headers', 'user', (data) => {setUserHeaderData(data)});
    });
  }, []);

  //Using API to fetch a credential token.
  async function handleLogin(user: string, password: string) {
    const res = await fetch(`${import.meta.env.VITE_SERVER}/login`, {
      method: 'post',
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify({
          username: user,
          password: password
      })
    })

    //Store token if recieved.      TODO<Should add fail handling>
    if (res.status === 200) {
      const { token } = await res.json();
      sessionStorage.setItem('token', token);
  //    setIsLoged(true);
      //if (!socket.connected)
      //console.log(socket.connected)
      window.location.reload();
    }
    else setIsLoged(false);
  }

  //Disconnects from socket and clear the credential token.
  function handleLogout() {
    console.log("trying to disconnect")
    socket.disconnect();
    sessionStorage.removeItem('token')
    setIsLoged(false);
  };

  //Calback from list items onClick events.
  function handleItemClicked(id: string) {
      setSelectedId(id)
  }

  return (
    <>
      {!isLoged ? <Login onClick={handleLogin}/> : null}
      <Header onClick={handleLogout}/>
        <Row>
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
              headerData!.map((data) => <TicketListItem data={data} selectedId={selectedId} onClick={handleItemClicked} key={data.date}/>) : null}
              {userHeaderData && selectedTab === 1 ? 
              userHeaderData!.map((data) => data.status != status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} onClick={handleItemClicked} key={data.date}/> : null) : null}
              {userHeaderData && selectedTab === 2 ? 
              userHeaderData!.map((data) => data.status === status.RESOLVED ? <TicketListItem data={data} selectedId={selectedId} onClick={handleItemClicked} key={data.date}/> : null) : null}
          </Col>
          <Col md={6}>
              <Container>
      {selectedId != ""  ? <TicketBody socket={socket} headData={headerData!.find((element => element._id == selectedId))} id={selectedId}/> : "naj"}
              </Container>
          </Col>
        </Row>
    </>
  )
}
