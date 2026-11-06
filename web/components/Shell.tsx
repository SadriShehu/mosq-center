'use client';
import { faBars, faDoorOpen, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Sidebar } from './Sidebar';

function toggleSidebar() {
  document.body.classList.toggle('sb-sidenav-toggled');
}

function Frame({ links, nav, children }: { links: { href: string; label: string }[]; nav: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="d-flex" id="wrapper">
      <Sidebar links={links} />
      <div id="page-content-wrapper">
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <div className="container-fluid">
            <button className="btn btn-success" id="sidebarToggle" aria-label="Toggle sidebar" onClick={toggleSidebar}>
              <FontAwesomeIcon icon={faBars} />
            </button>
            <button
              className="navbar-toggler"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className={`navbar-collapse collapse${open ? ' show' : ''}`}>
              <ul className="navbar-nav ms-auto mt-2 mt-lg-0">{nav}</ul>
            </div>
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}

/** Authenticated layout. Wrap in <AuthGuard>. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Frame
      links={[
        { href: '/lagjet', label: 'Lagjet' },
        { href: '/familjet', label: 'Familjet' },
        { href: '/pagesat', label: 'Pagesat' },
        { href: '/pagesat-pakryera', label: 'Pagesat e pakryera' },
      ]}
      nav={
        <>
          <li className="nav-item active"><Link className="nav-link" href="/user">Fillimi</Link></li>
          <Dropdown as="li" className="nav-item" align="end">
            <Dropdown.Toggle as="a" role="button" href="#" className="nav-link" id="navbarDropdown" onClick={(e: React.MouseEvent) => e.preventDefault()}>
              Shpalos
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} href="/user"><FontAwesomeIcon icon={faUser} /> Profili</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item
                href="/logout"
                onClick={() => { document.cookie = 'auth-store=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'; }}
              >
                <FontAwesomeIcon icon={faDoorOpen} /> Dil
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </>
      }
    >
      {children}
    </Frame>
  );
}

/** Public layout (no session). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <Frame
      links={[{ href: '/', label: 'Fillimi' }]}
      nav={<li className="nav-item"><a className="nav-link" href="/login">Kyqu</a></li>}
    >
      {children}
    </Frame>
  );
}
