import { useEffect, useState } from 'react'
import { Row, Container, Col } from 'react-bootstrap';
import {io, Socket} from 'socket.io-client';
import Login from './components/Login'
import Header from './components/Header';
import TicketBody from './components/TicketBody';
import { ITicketHeadData, IServerToClientEvents, IClientToServerEvents, status } from './typeLib';
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
  const [selectedTab, setSelectedTab] = useState<number>(initSelectedTab);

  //Loading headers on socket connect.
  useEffect(() => {
    socket.on('connect', () => {
      console.log("connected");
      setIsLoged(true);
      socket.emit('whoami', (id) => {sessionStorage.setItem('id', id)})
      socket.emit('headers', (data) => {setHeaderData(data)});
    });
  }, []);

  //Listen for uppdates from the server
  useEffect(() => {
  socket.on('updateHeaders', ()=>{
    socket.emit('headers', (data) => {setHeaderData(data)});
  });
  }, [headerData]);

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

    //Store token if recieved. 
    if (res.status === 200) {
      const { token } = await res.json();
      sessionStorage.setItem('token', token);
      //sessionStorage.setItem('name', data.name)
      window.location.reload();
    }
    else setIsLoged(false);
  }

  //Disconnects from socket and clear the credential token.
  function handleLogout() {
    socket.disconnect();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('name');
    setIsLoged(false);
  };

  //Calback from list items onClick events.
  function handleItemClicked(id: string) {
      setSelectedId(id)
  }

  //Callback for status emits
  function handleEmitStatus(id: string, status: status){
    socket.emit('pushStatus', {id: id, status: status})
  }

  //sets tab to stored value. Prevents errors if no value is set
  function initSelectedTab(){
    const tab = sessionStorage.getItem('selectedTab');
    if (!tab)
      return 0;
    else return parseInt(tab);
  }

  //Callback to handle tab changes
  function handleSelectedTab(tab: number){
    sessionStorage.setItem('selectedTab', tab.toString())
    setSelectedTab(tab)
  }

  return (
    <>
      {!isLoged ? <Login onClick={handleLogin}/> : null}
      <Header onClick={handleLogout}/>
        <Row>
          <TicketList headerData={headerData!} tabSwitchCallback={handleSelectedTab} selectedTab={selectedTab} selectedId={selectedId} onClick={handleItemClicked} emitStatus={handleEmitStatus}/>
          <Col md={6}>
              <Container>
      {selectedId != ""  ? <TicketBody socket={socket} headData={headerData!.find((element => element._id == selectedId))} tabSwitchCallback={handleSelectedTab} id={selectedId}/> : <About />}
              </Container>
          </Col>
        </Row>
    </>
  )
}
