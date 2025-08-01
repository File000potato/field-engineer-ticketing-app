// Mock data for demonstration when Supabase is unavailable
import { Ticket, UserProfile } from '@/types/ticket';

// Mock tickets data
export const mockTickets: Ticket[] = [
  {
    id: '1',
    ticket_number: 'TKT-001',
    title: 'Air Conditioning Unit Repair',
    description: 'HVAC unit in Building A is not cooling properly. Temperature readings show 28°C when should be 22°C.',
    type: 'maintenance',
    priority: 'high',
    status: 'open',
    created_by: '1',
    assigned_to: '3',
    equipment_id: '1',
    location: 'Building A - Floor 2',
    created_at: new Date('2024-01-15T09:00:00Z'),
    updated_at: new Date('2024-01-15T09:00:00Z'),
    due_date: new Date('2024-01-17T17:00:00Z'),
    estimated_hours: 4,
    actual_hours: 0,
    notes: 'Customer reports room too warm since yesterday',
    created_by_profile: {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    assigned_to_profile: {
      id: '3',
      email: 'engineer@test.com',
      full_name: 'Field Engineer',
      role: 'field_engineer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    equipment: {
      id: '1',
      name: 'HVAC Unit A-2',
      type: 'air_conditioning',
      model: 'Carrier 30XA',
      serial_number: 'CAR-2024-001',
      location: 'Building A - Floor 2',
      installation_date: new Date('2023-03-15'),
      warranty_expiry: new Date('2026-03-15'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    ticket_number: 'TKT-002',
    title: 'Elevator Inspection',
    description: 'Monthly safety inspection for elevator in Building B',
    type: 'inspection',
    priority: 'medium',
    status: 'in_progress',
    created_by: '2',
    assigned_to: '3',
    equipment_id: '2',
    location: 'Building B - Lobby',
    created_at: new Date('2024-01-14T10:30:00Z'),
    updated_at: new Date('2024-01-15T08:30:00Z'),
    assigned_at: new Date('2024-01-14T11:00:00Z'),
    due_date: new Date('2024-01-16T15:00:00Z'),
    estimated_hours: 2,
    actual_hours: 1.5,
    notes: 'Routine monthly inspection as per safety regulations',
    created_by_profile: {
      id: '2',
      email: 'supervisor@test.com',
      full_name: 'Supervisor User',
      role: 'supervisor',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    assigned_to_profile: {
      id: '3',
      email: 'engineer@test.com',
      full_name: 'Field Engineer',
      role: 'field_engineer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    equipment: {
      id: '2',
      name: 'Elevator B-1',
      type: 'elevator',
      model: 'Otis Gen2',
      serial_number: 'OTIS-2023-002',
      location: 'Building B - Lobby',
      installation_date: new Date('2023-06-20'),
      warranty_expiry: new Date('2025-06-20'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    ticket_number: 'TKT-003',
    title: 'Fire Safety System Check',
    description: 'Quarterly fire safety system inspection and testing',
    type: 'inspection',
    priority: 'high',
    status: 'resolved',
    created_by: '1',
    assigned_to: '3',
    verified_by: '2',
    equipment_id: '3',
    location: 'Building C - All Floors',
    created_at: new Date('2024-01-10T14:00:00Z'),
    updated_at: new Date('2024-01-12T16:30:00Z'),
    assigned_at: new Date('2024-01-10T14:30:00Z'),
    resolved_at: new Date('2024-01-12T15:00:00Z'),
    verified_at: new Date('2024-01-12T16:30:00Z'),
    due_date: new Date('2024-01-15T17:00:00Z'),
    estimated_hours: 6,
    actual_hours: 5.5,
    notes: 'All systems functioning properly. Minor sensor calibration performed.',
    created_by_profile: {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    assigned_to_profile: {
      id: '3',
      email: 'engineer@test.com',
      full_name: 'Field Engineer',
      role: 'field_engineer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    verified_by_profile: {
      id: '2',
      email: 'supervisor@test.com',
      full_name: 'Supervisor User',
      role: 'supervisor',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    equipment: {
      id: '3',
      name: 'Fire Safety System C',
      type: 'fire_safety',
      model: 'Honeywell FS90',
      serial_number: 'HON-2023-003',
      location: 'Building C - All Floors',
      installation_date: new Date('2023-01-10'),
      warranty_expiry: new Date('2028-01-10'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

// Mock users data
export const mockUsers: UserProfile[] = [
  {
    id: '1',
    email: 'admin@test.com',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'supervisor@test.com',
    full_name: 'Supervisor User',
    role: 'supervisor',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    email: 'engineer@test.com',
    full_name: 'Field Engineer',
    role: 'field_engineer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock dashboard stats
export const mockDashboardStats = {
  total_tickets: mockTickets.length,
  open_tickets: mockTickets.filter(t => t.status === 'open').length,
  in_progress_tickets: mockTickets.filter(t => t.status === 'in_progress').length,
  resolved_tickets: mockTickets.filter(t => t.status === 'resolved').length,
  overdue_tickets: mockTickets.filter(t => t.due_date && new Date(t.due_date) < new Date() && !['resolved', 'verified', 'closed'].includes(t.status)).length
};

// Mock data helper functions
export const mockDbHelpers = {
  async getTicketsWithRelations(userId?: string, role?: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter tickets based on role
    if (role === 'field_engineer' && userId) {
      return mockTickets.filter(t => t.created_by === userId || t.assigned_to === userId);
    }
    
    return mockTickets;
  },

  async getDashboardStats(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockDashboardStats;
  },

  async getUsers(role?: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (role) {
      return mockUsers.filter(u => u.role === role);
    }
    return mockUsers;
  },

  async getEquipment() {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTickets.map(t => t.equipment).filter(e => e);
  }
};
