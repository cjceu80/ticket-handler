import { useEffect, useState } from 'react'
import { Row, Container, Col } from 'react-bootstrap';
import {io, Socket} from 'socket.io-client';
import Login from './components/Login'
import Header from './components/Header';
import TicketBody from './components/TicketBody';
import { ITicketHeadData, IServerToClientEvents, IClientToServerEvents } from './typeLib';
import TicketList from './components/TicketList';
import About from './components/About';



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

  //Loading headers on socket connect.
  useEffect(() => {
    socket.on('connect', () => {
      console.log("connected");
      setIsLoged(true);
      socket.emit('headers', (data) => {setHeaderData(data)});
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
          <TicketList headerData={headerData!} selectedId={selectedId} onClick={handleItemClicked}/>
          <Col md={6}>
              <Container>
      {selectedId != ""  ? <TicketBody socket={socket} headData={headerData!.find((element => element._id == selectedId))} id={selectedId}/> : <About />}
              </Container>
          </Col>
        </Row>
    </>
  )
}
