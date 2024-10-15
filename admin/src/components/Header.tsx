import React from "react";
import { Navbar, Button, Container } from "react-bootstrap";

type ClickCallback = {
    onClick: () => void;
}

const Header: React.FC<ClickCallback> = ( {onClick}) => {

    return(
        <Navbar className="bg-body-secondary">
            <Container>
                <Navbar.Brand><h1>Tickets for ...</h1></Navbar.Brand>
                <Button onClick={()=>onClick()}>Logout</Button>
            </Container>
        </Navbar>
    )
}

export default Header