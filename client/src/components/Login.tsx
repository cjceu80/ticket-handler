import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

type TLoginProps = {
    onClick: (username: string, password: string) => void;
}


const Login: React.FC<TLoginProps> = ({onClick}) => {
    const [doesExistError, setExistError] = useState(false);
    const [isPasswordError, setIsPasswordError] = useState(false);
    const [isFilledError, setIsFilledError] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [user, setUser] = useState("");
    const [newAccount, setNewAccount] = useState(false);
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    async function handleCreateNewClick() {
        if (password != password2){
            setIsPasswordError(true);
        } else setIsPasswordError(false);
        if (firstName == "" || lastName == "" || user == "" || password == ""){
            setIsFilledError(true);
        } else setIsFilledError(false);

        if (isFilledError || isFilledError)
            return;

        const response = await fetch(`${import.meta.env.VITE_SERVER}/createlogin`, {
            method: 'post',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,  
                email: user,
                id2: password
            })
        })
        if (response.status == 409)
            setExistError(true);
        else 
        onClick(user, password);
    }

    return (
        <Modal show={true}>
            {newAccount ?
            <>
                <Modal.Header>
                Create new account
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Label>First name</Form.Label>
                        <Form.Control type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        <Form.Label>Last name</Form.Label>
                        <Form.Control type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" placeholder="sum@sum.sum" value={user} onChange={(e) => setUser(e.target.value)} />
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Form.Label>Repeat password</Form.Label>
                        <Form.Control type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                        {isFilledError && <div className="text-danger">All fields must be filled</div>}
                        {isPasswordError && <div className="text-danger">Passwords do not match</div>}
                        {doesExistError && <div className="text-danger">Email already in use</div>}
                    </Form>
                </Modal.Body>
                <Modal.Footer className="align-content-betwen">
                    <small className="primary" onClick={() => setNewAccount(false)}>Login with existing account</small>
                    <Button variant="secondary" onClick={()=> handleCreateNewClick()}>
                        Create
                    </Button>
                </Modal.Footer>
            </>
            :
            <>
                <Modal.Header>
                Login
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={user} onChange={(e) => setUser(e.target.value)} />
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password"value={password} onChange={(e) => setPassword(e.target.value)} />
                    </Form>
                </Modal.Body>
                <Modal.Footer className="align-content-betwen">
                    <small className="primary" onClick={() => setNewAccount(true)}>Create new account</small>
                    <Button variant="secondary" onClick={()=>onClick(user, password)}>
                        Login
                    </Button>
                </Modal.Footer>
            </>
            }
        </Modal>
    );
}

export default Login;