export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'fault' | 'maintenance' | 'inspection' | 'upgrade';
  status: 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  reportedBy: string;
  assignedTo?: string;
  equipmentId?: string;
  equipmentName?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
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
  type: 'comment' | 'status_change' | 'assignment' | 'media_upload';
  description: string;
  timestamp: Date;
  performedBy: string;
}
