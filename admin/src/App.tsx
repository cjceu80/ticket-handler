import { useEffect, useState } from 'react'
import { Row, Container, Col } from 'react-bootstrap';
import {io, Socket} from 'socket.io-client';
import Login from './components/Login'
import Header from './components/Header';
import TicketListItem from './components/TicketListItem';
import TicketBody from './components/TicketBody';
import { ITicketHeadData, IServerToClientEvents, IClientToServerEvents } from './typeLib';



const socket: Socket<IServerToClientEvents, IClientToServerEvents> = io('http://192.168.0.58:3000', {
  extraHeaders: {
      authorization: `bearer ${localStorage.getItem('token')}`
  },
  reconnectionAttempts: 1
});

export default function App() {
  const [isLoged, setIsLoged] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [headerData, setHeaderData] = useState<ITicketHeadData[]>();

  //Loading headers on socket connect.
  useEffect(() => {
    socket.on('connect', () => {
      console.log("connected");
      setIsLoged(true);
      socket.emit('headers', (e) => {setHeaderData(e.data); console.log(e.data);})
    });
  }, [isLoged]);

  //Using API to fetch a credential token.
  async function handleLogin(user: string, password: string) {
    const res = await fetch('http://localhost:3000/adminlogin', {
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
      localStorage.setItem('token', token);
      setIsLoged(true);
      if (!socket.connected)
        socket.connect();
    }
  }

  //Disconnects from socket and clear the credential token.
  function handleLogout() {
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
      <Container className='p-1 bg-body'>
        <Row className='m-1 border-bottom'>
          <Col>Subject</Col><Col>Created</Col><Col>Last</Col>
        </Row>
        {!headerData ? null :
        headerData.map((data) => <TicketListItem data={data} selectedId={selectedId} onClick={handleItemClicked} key={data.date}/>)}
      </Container>
      {selectedId != ""  ? <TicketBody socket={socket} data={headerData!.find((element => element.id == selectedId))} id={selectedId}/> : "naj"}
    </>
  )
}
