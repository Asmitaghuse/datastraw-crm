import { useState,useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
function App() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
  });
  const [noteText, setNoteText] = useState({});
  const [notes, setNotes] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("FETCH DATA:", data);
  console.log("FETCH ERROR:", error);

  if (error) {
    console.error("Fetch error:", error.message);
    return;
  }

  setTickets(data || []);
};
useEffect(() => {
  console.log("FETCH FUNCTION RUNNING");
  fetchTickets();
  fetchNotes();
}, []);
const filteredTickets = tickets.filter((ticket) => {
  const value = search.toLowerCase();

  const matchesSearch =
    ticket.ticket_id.toLowerCase().includes(value) ||
    ticket.customer_name.toLowerCase().includes(value) ||
    ticket.customer_email.toLowerCase().includes(value) ||
    ticket.description.toLowerCase().includes(value);

  const matchesStatus =
    statusFilter === "All" || ticket.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (
  !form.customer_name.trim() ||
  !form.customer_email.trim() ||
  !form.subject.trim() ||
  !form.description.trim()
) {
  alert("Please fill all fields");
  return;
}

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(form.customer_email)) {
    alert("Please enter a valid email address");
    return;
  }

  try {
  setLoading(true);

  const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
  ticket_id: `TKT-${Date.now()}`,
  customer_name: form.customer_name,
  customer_email: form.customer_email,
  subject: form.subject,
  description: form.description,
  status: "Open",
}
      ])
      .select()
      .single();

    if (error) {
  alert(error.message);
  return;
}
    console.log("Created Ticket:", data);
    alert(`Ticket created successfully! ID: ${data.ticket_id}`);
    await fetchTickets();

    setForm({
      customer_name: "",
      customer_email: "",
      subject: "",
      description: "",
    });
  } catch (error) {
    alert(JSON.stringify(error, null, 2));
    console.error("FULL ERROR:", error);
    alert("Something went wrong");
  }
  finally {
  setLoading(false);
}
};
const updateStatus = async (ticketId, newStatus) => {
  console.log("Updating:", ticketId, newStatus);

  const { data, error } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId)
    .select();

  console.log("Update result:", data);
  console.log("Update error:", error);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Status updated successfully!");
  fetchTickets();
};
const addNote = async (ticketId) => {
  const note = noteText[ticketId];

  if (!note || !note.trim()) {
    alert("Please enter a note");
    return;
  }

  const { error } = await supabase
    .from("notes")
    .insert([
      {
        ticket_id: ticketId,
        note: note.trim(),
      },
    ]);

  if (error) {
    console.error("Note error:", error);
    alert(error.message);
    return;
  }

  alert("Note added successfully!");

setNoteText({
  ...noteText,
  [ticketId]: "",
});

fetchNotes();
};
const fetchNotes = async () => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Notes fetch error:", error);
    return;
  }

  const groupedNotes = {};

  data.forEach((note) => {
    if (!groupedNotes[note.ticket_id]) {
      groupedNotes[note.ticket_id] = [];
    }

    groupedNotes[note.ticket_id].push(note);
  });

  setNotes(groupedNotes);
};
  return (
    <div className="app">
      {selectedTicket && (
  <div className="ticket-details">
    <h2>Ticket Details</h2>

    <p><strong>Ticket ID:</strong> {selectedTicket.ticket_id}</p>
    <p><strong>Customer:</strong> {selectedTicket.customer_name}</p>
    <p><strong>Email:</strong> {selectedTicket.customer_email}</p>
    <p><strong>Subject:</strong> {selectedTicket.subject}</p>
    <p><strong>Status:</strong> {selectedTicket.status}</p>
    <p><strong>Description:</strong> {selectedTicket.description}</p>

    <button onClick={() => setSelectedTicket(null)}>
      Close Details
    </button>
  </div>
)}
            <div className="ticket-list">
            
            <h2>Tickets</h2>

<input
  type="text"
  placeholder="Search by name, email, ticket ID, or description"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="All">All Statuses</option>
  <option value="Open">Open</option>
  <option value="In Progress">In Progress</option>
  <option value="Closed">Closed</option>
</select>

        {filteredTickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          filteredTickets.map((ticket) => (
            <div className="ticket-card" key={ticket.id}>
              <h3>{ticket.ticket_id}</h3>
              <button onClick={() => setSelectedTicket(ticket)}>
                View Details
              </button>
              <p><strong>Customer:</strong> {ticket.customer_name}</p>
              <p><strong>Email:</strong> {ticket.customer_email}</p>
              <p><strong>Subject:</strong> {ticket.subject}</p>
              <p>
  <strong>Status:</strong>{" "}
  <select
    value={ticket.status}
    onChange={(e) => {
      console.log("STATUS CHANGED:", e.target.value);
      updateStatus(ticket.id, e.target.value);
    }}
  >
    <option value="Open">Open</option>
    <option value="In Progress">In Progress</option>
    <option value="Closed">Closed</option>
  </select>
</p>
<div>
  <input
    type="text"
    placeholder="Add a note"
    value={noteText[ticket.id] || ""}
    onChange={(e) =>
      setNoteText({
        ...noteText,
        [ticket.id]: e.target.value,
      })
    }
  />

  <button onClick={() => addNote(ticket.id)}>
    Add Note
  </button>
</div>
              <p><strong>Description:</strong> {ticket.description}</p>
              <div>
  <strong>Notes:</strong>

  {notes[ticket.id] && notes[ticket.id].length > 0 ? (
    <ul>
      {notes[ticket.id].map((note) => (
        <li key={note.id}>
          {note.note}
        </li>
      ))}
    </ul>
  ) : (
    <p>No notes yet.</p>
  )}
</div>
            </div>
          ))
        )}
      </div>
      <h1>Customer Support CRM</h1>

      <div className="card">
        <h2>Create New Ticket</h2>

        <form onSubmit={handleSubmit}>
          <label>Customer Name</label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            placeholder="Enter customer name"
            required
          />

          <label>Customer Email</label>
          <input
            type="email"
            name="customer_email"
            value={form.customer_email}
            onChange={handleChange}
            placeholder="Enter customer email"
            required
          />

          <label>Subject</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Enter ticket subject"
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the issue"
            rows="5"
            required
          />

          <button type="submit" disabled={loading}>
             {loading ? "Creating..." : "Create Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;