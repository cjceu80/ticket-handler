import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

type ClickCallback = {
    onClick: (username: string, password: string) => void;
}

const Login: React.FC<ClickCallback> = ({onClick}) => {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");

    return (
        <Modal show={true}>
            <Modal.Header>
                Login
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="muppet" value={user} onChange={(e) => setUser(e.target.value)} />
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="master" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={()=>onClick(user, password)}>
                    Login
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Login;