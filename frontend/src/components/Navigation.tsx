import { Nav, Navbar, NavDropdown } from 'react-bootstrap'

function Navigation () {
  return (
        <Navbar expand="lg" fixed='top' className="nav bg-body-tertiary">
            <Navbar.Brand href="/">ESP32 Controls</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link href="controller">Controller</Nav.Link>
            </Nav>
            </Navbar.Collapse>
        </Navbar>
  );
}

export default Navigation;