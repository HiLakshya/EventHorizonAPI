// Role permissions configuration
const roles = {
    attendee: {
        permissions: [
            'browse_events',
            'purchase_tickets',
            'view_my_tickets',
            'cancel_ticket'
        ]
    },
    Organizer: {
        permissions: [
            'create_event',
            'update_event',
            'cancel_event',
            'view_sales',
            'assign_coorganizer',
            'browse_events',
            'remove_coorganizer',
            'delete_event'
        ]
    },
    'co-organizer': {
        permissions: [
            'update_event',
            'view_attendees',
            'browse_events'
        ]
    },
    Guest: {
        permissions: [
            'browse_events'
        ]
    }
};

module.exports = roles;
