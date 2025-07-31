export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  notes?: TicketNote[];
  mediaUrls?: string[];
}

export interface TicketNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Activity {
  id: string;
  ticketId: string;
  description: string;
  timestamp: string;
  performedBy: string;
}