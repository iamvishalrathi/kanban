const { Template } = require('../models');

const officialTemplates = [
  {
    name: 'Software Development',
    description: 'A complete software development workflow with columns for planning, development, testing, and deployment.',
    category: 'software',
    isOfficial: true,
    isPublic: true,
    tags: ['software', 'development', 'agile', 'scrum'],
    thumbnail: '/images/templates/software-dev.png',
    config: {
      board: {
        title: 'Software Development Board',
        description: 'Track your software development tasks from planning to deployment',
        backgroundColor: '#1e40af',
        settings: {
          allowComments: true,
          allowAttachments: true,
          enableTimeTracking: true
        }
      },
      columns: [
        {
          title: 'Backlog',
          position: 0,
          color: '#e5e7eb',
          wipLimit: null,
          cards: [
            {
              title: 'User Authentication System',
              description: 'Implement secure user authentication with JWT tokens',
              position: 0,
              priority: 'high',
              labels: ['backend', 'security'],
              estimatedHours: 8,
              checklist: [
                { text: 'Create user registration endpoint', completed: false },
                { text: 'Create login endpoint', completed: false },
                { text: 'Implement JWT middleware', completed: false },
                { text: 'Add password hashing', completed: false },
                { text: 'Write unit tests', completed: false }
              ]
            }
          ]
        },
        {
          title: 'To Do',
          position: 1,
          color: '#fecaca',
          wipLimit: 5,
          cards: []
        },
        {
          title: 'In Progress',
          position: 2,
          color: '#fed7aa',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Code Review',
          position: 3,
          color: '#fde68a',
          wipLimit: 2,
          cards: []
        },
        {
          title: 'Testing',
          position: 4,
          color: '#bfdbfe',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Done',
          position: 5,
          color: '#bbf7d0',
          wipLimit: null,
          cards: []
        }
      ]
    }
  },
  {
    name: 'Marketing Campaign',
    description: 'Organize your marketing campaigns from ideation to analysis.',
    category: 'marketing',
    isOfficial: true,
    isPublic: true,
    tags: ['marketing', 'campaign', 'content'],
    thumbnail: '/images/templates/marketing.png',
    config: {
      board: {
        title: 'Marketing Campaign Board',
        description: 'Plan, execute, and track your marketing campaigns',
        backgroundColor: '#7c3aed',
        settings: {
          allowComments: true,
          allowAttachments: true,
          enableTimeTracking: false
        }
      },
      columns: [
        {
          title: 'Ideas',
          position: 0,
          color: '#e5e7eb',
          wipLimit: null,
          cards: [
            {
              title: 'Social Media Campaign for Product Launch',
              description: 'Create engaging social media content for the new product launch',
              position: 0,
              priority: 'medium',
              labels: ['social-media', 'product-launch'],
              estimatedHours: 16,
              checklist: []
            }
          ]
        },
        {
          title: 'Planning',
          position: 1,
          color: '#fecaca',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Content Creation',
          position: 2,
          color: '#fed7aa',
          wipLimit: 5,
          cards: []
        },
        {
          title: 'Review & Approval',
          position: 3,
          color: '#fde68a',
          wipLimit: 2,
          cards: []
        },
        {
          title: 'Publishing',
          position: 4,
          color: '#bfdbfe',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Analysis',
          position: 5,
          color: '#bbf7d0',
          wipLimit: null,
          cards: []
        }
      ]
    }
  },
  {
    name: 'Personal Task Management',
    description: 'Simple personal productivity system for managing daily tasks and goals.',
    category: 'personal',
    isOfficial: true,
    isPublic: true,
    tags: ['personal', 'productivity', 'gtd'],
    thumbnail: '/images/templates/personal.png',
    config: {
      board: {
        title: 'Personal Tasks',
        description: 'Stay organized with your personal tasks and goals',
        backgroundColor: '#059669',
        settings: {
          allowComments: false,
          allowAttachments: true,
          enableTimeTracking: true
        }
      },
      columns: [
        {
          title: 'Inbox',
          position: 0,
          color: '#e5e7eb',
          wipLimit: null,
          cards: [
            {
              title: 'Organize home office',
              description: 'Clean and reorganize the home office space',
              position: 0,
              priority: 'low',
              labels: ['home', 'organization'],
              estimatedHours: 2,
              checklist: [
                { text: 'Sort through papers', completed: false },
                { text: 'Organize cables', completed: false },
                { text: 'Clean desk surface', completed: false }
              ]
            }
          ]
        },
        {
          title: 'Today',
          position: 1,
          color: '#fecaca',
          wipLimit: 5,
          cards: []
        },
        {
          title: 'This Week',
          position: 2,
          color: '#fed7aa',
          wipLimit: 10,
          cards: []
        },
        {
          title: 'Someday',
          position: 3,
          color: '#fde68a',
          wipLimit: null,
          cards: []
        },
        {
          title: 'Completed',
          position: 4,
          color: '#bbf7d0',
          wipLimit: null,
          cards: []
        }
      ]
    }
  },
  {
    name: 'Project Management',
    description: 'Comprehensive project management template for complex projects.',
    category: 'project-management',
    isOfficial: true,
    isPublic: true,
    tags: ['project', 'management', 'planning'],
    thumbnail: '/images/templates/project-management.png',
    config: {
      board: {
        title: 'Project Management Board',
        description: 'Manage complex projects with multiple phases and stakeholders',
        backgroundColor: '#dc2626',
        settings: {
          allowComments: true,
          allowAttachments: true,
          enableTimeTracking: true
        }
      },
      columns: [
        {
          title: 'Planning',
          position: 0,
          color: '#e5e7eb',
          wipLimit: null,
          cards: [
            {
              title: 'Project Kickoff Meeting',
              description: 'Initial meeting with all stakeholders to align on project goals and timeline',
              position: 0,
              priority: 'high',
              labels: ['meeting', 'planning'],
              estimatedHours: 2,
              checklist: [
                { text: 'Prepare agenda', completed: false },
                { text: 'Invite stakeholders', completed: false },
                { text: 'Book meeting room', completed: false }
              ]
            }
          ]
        },
        {
          title: 'In Progress',
          position: 1,
          color: '#fed7aa',
          wipLimit: 7,
          cards: []
        },
        {
          title: 'Review',
          position: 2,
          color: '#fde68a',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Testing',
          position: 3,
          color: '#bfdbfe',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Completed',
          position: 4,
          color: '#bbf7d0',
          wipLimit: null,
          cards: []
        },
        {
          title: 'On Hold',
          position: 5,
          color: '#d1d5db',
          wipLimit: null,
          cards: []
        }
      ]
    }
  },
  {
    name: 'HR Recruitment',
    description: 'Track candidates through the hiring process from application to onboarding.',
    category: 'hr',
    isOfficial: true,
    isPublic: true,
    tags: ['hr', 'recruitment', 'hiring'],
    thumbnail: '/images/templates/hr-recruitment.png',
    config: {
      board: {
        title: 'HR Recruitment Pipeline',
        description: 'Track candidates through the complete hiring process',
        backgroundColor: '#7c2d12',
        settings: {
          allowComments: true,
          allowAttachments: true,
          enableTimeTracking: false
        }
      },
      columns: [
        {
          title: 'New Applications',
          position: 0,
          color: '#e5e7eb',
          wipLimit: null,
          cards: [
            {
              title: 'John Doe - Frontend Developer',
              description: 'React developer with 3 years experience, applied for senior frontend position',
              position: 0,
              priority: 'medium',
              labels: ['frontend', 'react', 'senior'],
              estimatedHours: 0,
              checklist: [
                { text: 'Review resume', completed: false },
                { text: 'Check portfolio', completed: false },
                { text: 'Verify references', completed: false }
              ]
            }
          ]
        },
        {
          title: 'Phone Screening',
          position: 1,
          color: '#fecaca',
          wipLimit: 5,
          cards: []
        },
        {
          title: 'Technical Interview',
          position: 2,
          color: '#fed7aa',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Final Interview',
          position: 3,
          color: '#fde68a',
          wipLimit: 2,
          cards: []
        },
        {
          title: 'Offer Extended',
          position: 4,
          color: '#bfdbfe',
          wipLimit: 3,
          cards: []
        },
        {
          title: 'Hired',
          position: 5,
          color: '#bbf7d0',
          wipLimit: null,
          cards: []
        },
        {
          title: 'Rejected',
          position: 6,
          color: '#d1d5db',
          wipLimit: null,
          cards: []
        }
      ]
    }
  }
];

async function seedOfficialTemplates() {
  try {
    console.log('Seeding official templates...');
    
    for (const templateData of officialTemplates) {
      const existingTemplate = await Template.findOne({
        where: { name: templateData.name, isOfficial: true }
      });

      if (!existingTemplate) {
        await Template.create({
          ...templateData,
          createdById: '00000000-0000-0000-0000-000000000000' // System user ID
        });
        console.log(`✅ Created template: ${templateData.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${templateData.name}`);
      }
    }
    
    console.log('✅ Official templates seeding completed');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}

module.exports = { seedOfficialTemplates };