import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'ticketing_app_data';

const mockTickets = [
  {
    id: '1',
    title: 'Generator Unit 3 Not Starting',
    description: 'Generator fails to start during routine check. No error codes displayed.',
    type: 'fault',
    priority: 'high',
    status: 'open',
    equipmentId: 'GEN-003',
    equipmentName: 'Diesel Generator Unit 3',
    location: 'Power Plant - Building A',
    reportedBy: 'John Smith',
    createdAt: new Date('2024-01-15T09:30:00'),
    updatedAt: new Date('2024-01-15T09:30:00')
  },
  {
    id: '2',
    title: 'Scheduled Maintenance - Pump System',
    description: 'Monthly maintenance check for cooling pump system including filter replacement.',
    type: 'maintenance',
    priority: 'medium',
    status: 'in-progress',
    equipmentId: 'PUMP-012',
    equipmentName: 'Cooling Pump System',
    location: 'Facility B - Ground Floor',
    reportedBy: 'Sarah Johnson',
    assignedTo: 'Mike Wilson',
    createdAt: new Date('2024-01-14T14:15:00'),
    updatedAt: new Date('2024-01-15T08:00:00')
  }
];

const mockActivities = [
  {
    id: '1',
    ticketId: '2',
    type: 'status_change',
    description: 'Status changed from Open to In Progress',
    performedBy: 'Mike Wilson',
    timestamp: new Date('2024-01-15T08:00:00')
  }
];

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
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
  const saveData = (newTickets, newActivities) => {
    try {
      const data = {
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

  const createTicket = (ticketData) => {
    const newTicket = {
      ...ticketData,
      id: Date.now().toString(),
      equipmentId: `EQ-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newTickets = [...tickets, newTicket];
    const newActivity = {
      id: Date.now().toString(),
      ticketId: newTicket.id,
      type: 'comment',
      description: `Ticket created: ${newTicket.title}`,
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

  const updateTicketStatus = (ticketId, status) => {
    const newTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status, 
            updatedAt: new Date(),
            resolvedAt: status === 'resolved' ? new Date() : ticket.resolvedAt
          }
        : ticket
    );

    const newActivity = {
      id: Date.now().toString(),
      ticketId,
      type: 'status_change',
      description: `Status changed to ${status}`,
      performedBy: 'Current User',
      timestamp: new Date()
    };
    const newActivities = [...activities, newActivity];

    setTickets(newTickets);
    setActivities(newActivities);
    saveData(newTickets, newActivities);

    toast({
      title: 'Success',
      description: 'Ticket status updated'
    });
  };

  const addNote = (ticketId, note) => {
    const newActivity = {
      id: Date.now().toString(),
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
      title: 'Success',
      description: 'Note added successfully'
    });
  };

  const getActivitiesForTicket = (ticketId) => {
    return activities
      .filter(activity => activity.ticketId === ticketId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return {
    tickets,
    activities,
    loading,
    createTicket,
    updateTicketStatus,
    addNote,
    getActivitiesForTicket
  };
};