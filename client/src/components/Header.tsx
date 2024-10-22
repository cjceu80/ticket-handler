import React from "react";
import { Navbar, Button, Container } from "react-bootstrap";

type THeaderProps = {
    user: string | null;
    onClick: () => void;
}

const Header: React.FC<THeaderProps> = ( {onClick, user}) => {

    return(
        <Navbar className="bg-body-secondary">
            <Container>
                <Navbar.Brand><h1>Tickets for {user}</h1></Navbar.Brand>
                <Button onClick={()=>onClick()}>Logout</Button>
            </Container>
        </Navbar>
    )
}

export default Header