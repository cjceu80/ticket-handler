import { useEffect, useState } from 'react'
import { Row, Container, Col } from 'react-bootstrap';
import Login from './components/Login'
import Header from './components/Header';
import TicketListItem from './components/TicketListItem';
import TicketBody from './components/TicketBody';
import { ITicketHeadData } from './typeLib';


export default function App() {
  const [isLoged, setIsLoged] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [headerData, setHeaderData] = useState<ITicketHeadData[]>();

  useEffect(() => {
    if (sessionStorage.getItem("token"))
      setIsLoged(true);
  }, [isLoged]);

  //Loading headers on socket connect.
  useEffect(() => {
      if (!isLoged)
        return;

      fetch(`${import.meta.env.VITE_SERVER}/headers`, {
      method: 'get',
      headers: {
          authorization: `bearer ${sessionStorage.getItem('token')}`
      },})
    .then((response) => {
      if (response.status != 200)
        setIsLoged(false);
      return response.json();})
    .then(data => {setHeaderData(data.data);})
    
  }, [isLoged]);

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
      await fetch(`${import.meta.env.VITE_SERVER}/self`, {
        method: 'get',
        headers: {
            authorization: `bearer ${sessionStorage.getItem('token')}`
        },})
      .then((response) => {
        if (response.status != 200)
          setIsLoged(false);
          
        return response.json();})
        .then((data) => {
          sessionStorage.setItem('name', data.name)
          sessionStorage.setItem('id', data.id)
        })
      setIsLoged(true);
    }
  }

  //Disconnects from socket and clear the credential token.
  function handleLogout() {
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
      {selectedId != ""  ? <TicketBody data={headerData!.find((element => element._id == selectedId))} id={selectedId}/> : "naj"}
    </>
  )
}
