import { useState, useEffect } from 'react';
import { Ticket, Activity } from '@/types/ticket';
import { toast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'ticketing_app_data';

interface TicketData {
  tickets: Ticket[];
  activities: Activity[];
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Generator Unit 3 Not Starting',
    description: 'Generator fails to start during routine check. No error codes displayed. Need immediate inspection to determine root cause.',
    type: 'fault',
    priority: 'high',
    status: 'open',
    equipmentId: 'GEN-003',
    equipmentName: 'Diesel Generator Unit 3',
    location: 'Power Plant - Building A',
    reportedBy: 'john.smith@company.com',
    assignedTo: 'mike.wilson@company.com',
    createdAt: new Date('2024-01-15T09:30:00'),
    updatedAt: new Date('2024-01-15T09:30:00')
  },
  {
    id: '2',
    title: 'Scheduled Maintenance - Pump System',
    description: 'Monthly maintenance check for cooling pump system including filter replacement and pressure testing.',
    type: 'maintenance',
    priority: 'medium',
    status: 'in_progress',
    equipmentId: 'PUMP-012',
    equipmentName: 'Cooling Pump System',
    location: 'Facility B - Ground Floor',
    reportedBy: 'sarah.johnson@company.com',
    assignedTo: 'mike.wilson@company.com',
    createdAt: new Date('2024-01-14T14:15:00'),
    updatedAt: new Date('2024-01-15T08:00:00')
  },
  {
    id: '3',
    title: 'HVAC System Temperature Control Issue',
    description: 'Temperature sensors showing inconsistent readings. Climate control not maintaining set temperature.',
    type: 'fault',
    priority: 'medium',
    status: 'open',
    equipmentId: 'HVAC-007',
    equipmentName: 'Main Building HVAC Unit',
    location: 'Main Building - Roof Access',
    reportedBy: 'facilities@company.com',
    createdAt: new Date('2024-01-16T11:20:00'),
    updatedAt: new Date('2024-01-16T11:20:00')
  },
  {
    id: '4',
    title: 'Critical Power Outage - Server Room',
    description: 'Partial power loss in server room. UPS systems engaged. Immediate attention required to prevent data loss.',
    type: 'fault',
    priority: 'critical',
    status: 'in_progress',
    equipmentId: 'PWR-001',
    equipmentName: 'Server Room Power Distribution',
    location: 'Data Center - Level B2',
    reportedBy: 'it.ops@company.com',
    assignedTo: 'emergency.tech@company.com',
    createdAt: new Date('2024-01-16T14:45:00'),
    updatedAt: new Date('2024-01-16T15:30:00')
  },
  {
    id: '5',
    title: 'Fire Safety System Inspection',
    description: 'Quarterly inspection of fire suppression systems and emergency exits. Required by safety regulations.',
    type: 'inspection',
    priority: 'high',
    status: 'resolved',
    equipmentId: 'FIRE-001',
    equipmentName: 'Building Fire Safety Systems',
    location: 'All Buildings - Multiple Locations',
    reportedBy: 'safety@company.com',
    assignedTo: 'inspector@company.com',
    createdAt: new Date('2024-01-10T08:00:00'),
    updatedAt: new Date('2024-01-12T16:30:00'),
    resolvedAt: new Date('2024-01-12T16:30:00')
  }
];

const mockActivities: Activity[] = [
  {
    id: '1',
    ticketId: '2',
    type: 'status_change',
    description: 'Status changed from Open to In Progress',
    performedBy: 'mike.wilson@company.com',
    timestamp: new Date('2024-01-15T08:00:00')
  },
  {
    id: '2',
    ticketId: '2',
    type: 'comment',
    description: 'Started maintenance work. Shutting down cooling system for filter replacement.',
    performedBy: 'mike.wilson@company.com',
    timestamp: new Date('2024-01-15T08:15:00')
  },
  {
    id: '3',
    ticketId: '4',
    type: 'assignment',
    description: 'Ticket assigned to emergency technician',
    performedBy: 'system',
    timestamp: new Date('2024-01-16T14:50:00')
  },
  {
    id: '4',
    ticketId: '4',
    type: 'status_change',
    description: 'Status changed to In Progress - Emergency response activated',
    performedBy: 'emergency.tech@company.com',
    timestamp: new Date('2024-01-16T15:00:00')
  },
  {
    id: '5',
    ticketId: '5',
    type: 'status_change',
    description: 'Inspection completed successfully. All systems operational.',
    performedBy: 'inspector@company.com',
    timestamp: new Date('2024-01-12T16:30:00')
  }
];

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data: TicketData = JSON.parse(stored);
          setTickets(data.tickets.map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : undefined
          })));
          setActivities(data.activities.map(a => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })));
        } else {
          setTickets(mockTickets);
          setActivities(mockActivities);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setTickets(mockTickets);
        setActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const saveData = (newTickets: Ticket[], newActivities: Activity[]) => {
    try {
      const data: TicketData = {
        tickets: newTickets,
        activities: newActivities
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save data',
        variant: 'destructive'
      });
    }
  };

  const createTicket = (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: `TICK-${Date.now()}`,
      equipmentId: ticketData.equipmentId || `EQ-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newTickets = [...tickets, newTicket];
    const newActivity: Activity = {
      id: `ACT-${Date.now()}`,
      ticketId: newTicket.id,
      type: 'comment',
      description: `New ${newTicket.type} ticket created: ${newTicket.title}`,
      performedBy: ticketData.reportedBy,
      timestamp: new Date()
    };
    const newActivities = [...activities, newActivity];

    setTickets(newTickets);
    setActivities(newActivities);
    saveData(newTickets, newActivities);

    toast({
      title: 'Success',
      description: 'Ticket created successfully'
    });

    return newTicket;
  };

  const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const newTickets = tickets.map(ticket =>
      ticket.id === ticketId
        ? {
            ...ticket,
            ...updates,
            updatedAt: new Date(),
            resolvedAt: updates.status === 'resolved' ? new Date() : ticket.resolvedAt
          }
        : ticket
    );

    setTickets(newTickets);
    saveData(newTickets, activities);

    toast({
      title: 'Success',
      description: 'Ticket updated successfully'
    });
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    updateTicket(ticketId, { status });

    const newActivity: Activity = {
      id: `ACT-${Date.now()}`,
      ticketId,
      type: 'status_change',
      description: `Status changed from ${ticket.status} to ${status}`,
      performedBy: 'Current User',
      timestamp: new Date()
    };
    const newActivities = [...activities, newActivity];

    setActivities(newActivities);
    saveData(tickets, newActivities);

    toast({
      title: 'Status Updated',
      description: `Ticket status changed to ${status.replace('_', ' ')}`
    });
  };

  const addNote = (ticketId: string, note: string) => {
    const newActivity: Activity = {
      id: `ACT-${Date.now()}`,
      ticketId,
      type: 'comment',
      description: note,
      performedBy: 'Current User',
      timestamp: new Date()
    };
    const newActivities = [...activities, newActivity];

    setActivities(newActivities);
    saveData(tickets, newActivities);

    toast({
      title: 'Note Added',
      description: 'Your note has been added to the ticket'
    });
  };

  const deleteTicket = (ticketId: string) => {
    const newTickets = tickets.filter(t => t.id !== ticketId);
    const newActivities = activities.filter(a => a.ticketId !== ticketId);

    setTickets(newTickets);
    setActivities(newActivities);
    saveData(newTickets, newActivities);

    toast({
      title: 'Ticket Deleted',
      description: 'The ticket has been permanently deleted'
    });
  };

  const getActivitiesForTicket = (ticketId: string) => {
    return activities
      .filter(activity => activity.ticketId === ticketId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return {
    tickets,
    activities,
    loading,
    createTicket,
    updateTicket,
    updateTicketStatus,
    addNote,
    deleteTicket,
    getActivitiesForTicket
  };
};
