import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only POST request is allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      customer_name,
      customer_email,
      subject,
      description,
    } = req.body;

    // Basic validation
    if (!customer_name || !customer_email || !subject || !description) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Generate unique ticket ID
    const ticketId = `TKT-${Date.now()}`;

    // Save ticket in Supabase
    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          ticket_id: ticketId,
          customer_name,
          customer_email,
          subject,
          description,
          status: "Open",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        error: "Failed to create ticket",
      });
    }

    return res.status(201).json({
      message: "Ticket created successfully",
      ticket: data,
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}