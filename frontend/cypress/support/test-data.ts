/**
 * Test data generators and helpers for Cypress tests
 */

export const generateTestEmail = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

export const generateStrongPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const all = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill rest with random characters
  for (let i = password.length; i < 16; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const testCredentials = {
  valid: {
    email: 'test@example.com',
    password: 'SecureP@ssw0rd123!',
  },
  weak: {
    password: 'password123',
  },
  strong: {
    password: 'V3ry$tr0ng&Un1qu3P@ssw0rd!2024',
  },
};

export const sampleCredentials = [
  {
    title: 'GitHub',
    username: 'githubuser',
    password: 'GitHubP@ss123',
    url: 'https://github.com',
    notes: 'My GitHub account',
  },
  {
    title: 'Gmail',
    username: 'user@gmail.com',
    password: 'GmailP@ss456',
    url: 'https://gmail.com',
    notes: 'Personal email',
  },
  {
    title: 'AWS Console',
    username: 'aws-admin',
    password: 'AwsP@ss789',
    url: 'https://console.aws.amazon.com',
    notes: 'AWS root account',
  },
];

export const csvImportData = {
  chrome: `name,url,username,password
GitHub,https://github.com,chromeuser,ChromeP@ss123
Gmail,https://gmail.com,user@gmail.com,GmailP@ss456`,
  
  firefox: `url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged
https://github.com,firefoxuser,FirefoxP@ss123,,,{12345678-1234-1234-1234-123456789012},1234567890,1234567890,1234567890`,
  
  lastpass: `url,username,password,extra,name,grouping,fav
https://github.com,lastpassuser,LastPassP@ss123,,GitHub,Work,0`,
  
  onepassword: `Title,URL,Username,Password,Notes,Type
GitHub,https://github.com,onepassuser,OnePasswordP@ss123,My GitHub account,Login`,
};

export const waitForElement = (selector: string, timeout = 10000) => {
  return cy.get(selector, { timeout }).should('be.visible');
};

export const fillCredentialForm = (credential: {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}) => {
  cy.get('input[name="title"]').type(credential.title);
  cy.get('input[name="username"]').type(credential.username);
  cy.get('input[name="password"]').type(credential.password);
  
  if (credential.url) {
    cy.get('input[name="url"]').type(credential.url);
  }
  
  if (credential.notes) {
    cy.get('textarea[name="notes"]').type(credential.notes);
  }
};

export const clearAllData = () => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearIndexedDB();
};
