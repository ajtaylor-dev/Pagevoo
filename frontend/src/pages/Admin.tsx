export default function Admin() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 className="h1">Admin area</h1>
          <ul>
            <li>User management (create/edit/delete)</li>
            <li>Site management (create/duplicate/delete)</li>
            <li>Template management (create/clone/enable/disable/versioning)</li>
            <li>Packages & billing config (Stripe/PayPal)</li>
          </ul>
          <p className="muted small">Placeholder; functionality is built server-side via the API.</p>
        </div>
      </div>
    </div>
  )
}
