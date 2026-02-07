/**
 * URL Detection Integration Test
 * 
 * Tests the integration of URL detection with the vault UI components
 */

import { render, screen, waitFor } from '@testing-library/react';
import { VaultList } from '../VaultList';
import { useVault } from '@/hooks/useVault';
import { useSearch } from '@/hooks/useSearch';
import { useURLDetection } from '@/hooks/useURLDetection';
import { useResponsiveClasses } from '@/hooks/useResponsive';

// Mock hooks
jest.mock('@/hooks/useVault');
jest.mock('@/hooks/useSearch');
jest.mock('@/hooks/useURLDetection');
jest.mock('@/hooks/useResponsive');

const mockUseVault = useVault as jest.MockedFunction<typeof useVault>;
const mockUseSearch = useSearch as jest.MockedFunction<typeof useSearch>;
const mockUseURLDetection = useURLDetection as jest.MockedFunction<typeof useURLDetection>;
const mockUseResponsiveClasses = useResponsiveClasses as jest.MockedFunction<typeof useResponsiveClasses>;

describe('URL Detection Integration', () => {
  const mockCredentials = [
    {
      id: '1',
      title: 'Example Login',
      username: 'user1@example.com',
      password: 'password123',
      url: 'https://example.com/login',
      notes: '',
      folderId: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      encryptedData: '',
      iv: '',
      authTag: ''
    },
    {
      id: '2',
      title: 'Different Site',
      username: 'user2@different.com',
      password: 'password456',
      url: 'https://different.com',
      notes: '',
      folderId: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      encryptedData: '',
      iv: '',
      authTag: ''
    }
  ];

  beforeEach(() => {
    // Setup default mocks
    mockUseVault.mockReturnValue({
      credentials: mockCredentials,
      secureNotes: [],
      folders: [],
      tags: [],
      selectedFolderId: null,
      selectedTags: [],
      setSelectedFolder: jest.fn(),
      setSelectedTags: jest.fn(),
      isLoading: false,
      error: null,
      addCredential: jest.fn(),
      updateCredential: jest.fn(),
      deleteCredential: jest.fn(),
      getCredential: jest.fn(),
      syncVault: jest.fn()
    } as any);

    mockUseSearch.mockReturnValue({
      query: '',
      searchResults: [],
      hasQuery: false,
      hasResults: false,
      isEmpty: false,
      setQuery: jest.fn(),
      clearQuery: jest.fn()
    } as any);

    mockUseResponsiveClasses.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      getTouchTargetClasses: () => '',
      getResponsiveClasses: () => ''
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display URL detection status when URL is detected', () => {
    mockUseURLDetection.mockReturnValue({
      currentURL: {
        url: 'https://example.com',
        domain: 'example.com',
        protocol: 'https:',
        subdomain: undefined,
        port: undefined
      },
      isSupported: true,
      matchingCredentials: [
        {
          credential: mockCredentials[0],
          matchType: 'exact',
          matchScore: 100
        }
      ],
      isDetecting: false,
      refreshURLDetection: jest.fn(),
      setCurrentURL: jest.fn(),
      isCredentialMatching: (id: string) => id === '1' ? { credential: mockCredentials[0], matchType: 'exact', matchScore: 100 } : null,
      getMatchScore: (id: string) => id === '1' ? 100 : 0,
      getMatchType: (id: string) => id === '1' ? 'exact' : null,
      getMatchingCredentials: () => [{
        credential: mockCredentials[0],
        matchType: 'exact',
        matchScore: 100
      }],
      getTopMatch: () => ({
        credential: mockCredentials[0],
        matchType: 'exact',
        matchScore: 100
      }),
      hasMatches: () => true,
      getCurrentDomain: () => 'example.com',
      getCurrentURLString: () => 'https://example.com',
      getDetectionStatus: jest.fn()
    } as any);

    render(<VaultList />);

    // Check that URL detection status is displayed
    expect(screen.getByText(/Current site:/)).toBeInTheDocument();
    expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/1 matching credential/)).toBeInTheDocument();
  });

  it('should not display URL detection status when no URL is detected', () => {
    mockUseURLDetection.mockReturnValue({
      currentURL: null,
      isSupported: true,
      matchingCredentials: [],
      isDetecting: false,
      refreshURLDetection: jest.fn(),
      setCurrentURL: jest.fn(),
      isCredentialMatching: () => null,
      getMatchScore: () => 0,
      getMatchType: () => null,
      getMatchingCredentials: () => [],
      getTopMatch: () => null,
      hasMatches: () => false,
      getCurrentDomain: () => null,
      getCurrentURLString: () => null,
      getDetectionStatus: jest.fn()
    } as any);

    render(<VaultList />);

    // Check that URL detection status is NOT displayed
    expect(screen.queryByText(/Current site:/)).not.toBeInTheDocument();
  });

  it('should prioritize matching credentials in sort order', () => {
    mockUseURLDetection.mockReturnValue({
      currentURL: {
        url: 'https://example.com',
        domain: 'example.com',
        protocol: 'https:',
        subdomain: undefined,
        port: undefined
      },
      isSupported: true,
      matchingCredentials: [
        {
          credential: mockCredentials[0],
          matchType: 'exact',
          matchScore: 100
        }
      ],
      isDetecting: false,
      refreshURLDetection: jest.fn(),
      setCurrentURL: jest.fn(),
      isCredentialMatching: (id: string) => id === '1' ? { credential: mockCredentials[0], matchType: 'exact', matchScore: 100 } : null,
      getMatchScore: (id: string) => id === '1' ? 100 : 0,
      getMatchType: (id: string) => id === '1' ? 'exact' : null,
      getMatchingCredentials: () => [{
        credential: mockCredentials[0],
        matchType: 'exact',
        matchScore: 100
      }],
      getTopMatch: () => ({
        credential: mockCredentials[0],
        matchType: 'exact',
        matchScore: 100
      }),
      hasMatches: () => true,
      getCurrentDomain: () => 'example.com',
      getCurrentURLString: () => 'https://example.com',
      getDetectionStatus: jest.fn()
    } as any);

    render(<VaultList />);

    // The matching credential should be displayed
    expect(screen.getByText('Example Login')).toBeInTheDocument();
    expect(screen.getByText('Different Site')).toBeInTheDocument();
  });

  it('should handle URL detection not supported', () => {
    mockUseURLDetection.mockReturnValue({
      currentURL: null,
      isSupported: false,
      matchingCredentials: [],
      isDetecting: false,
      refreshURLDetection: jest.fn(),
      setCurrentURL: jest.fn(),
      isCredentialMatching: () => null,
      getMatchScore: () => 0,
      getMatchType: () => null,
      getMatchingCredentials: () => [],
      getTopMatch: () => null,
      hasMatches: () => false,
      getCurrentDomain: () => null,
      getCurrentURLString: () => null,
      getDetectionStatus: jest.fn()
    } as any);

    render(<VaultList />);

    // Should still render the vault list without URL detection
    expect(screen.getByText('Example Login')).toBeInTheDocument();
    expect(screen.queryByText(/Current site:/)).not.toBeInTheDocument();
  });

  it('should display match count correctly', () => {
    const multipleMatches = [
      {
        credential: mockCredentials[0],
        matchType: 'exact' as const,
        matchScore: 100
      },
      {
        credential: mockCredentials[1],
        matchType: 'domain' as const,
        matchScore: 90
      }
    ];

    mockUseURLDetection.mockReturnValue({
      currentURL: {
        url: 'https://example.com',
        domain: 'example.com',
        protocol: 'https:',
        subdomain: undefined,
        port: undefined
      },
      isSupported: true,
      matchingCredentials: multipleMatches,
      isDetecting: false,
      refreshURLDetection: jest.fn(),
      setCurrentURL: jest.fn(),
      isCredentialMatching: (id: string) => {
        const match = multipleMatches.find(m => m.credential.id === id);
        return match || null;
      },
      getMatchScore: (id: string) => {
        const match = multipleMatches.find(m => m.credential.id === id);
        return match?.matchScore || 0;
      },
      getMatchType: (id: string) => {
        const match = multipleMatches.find(m => m.credential.id === id);
        return match?.matchType || null;
      },
      getMatchingCredentials: () => multipleMatches,
      getTopMatch: () => multipleMatches[0],
      hasMatches: () => true,
      getCurrentDomain: () => 'example.com',
      getCurrentURLString: () => 'https://example.com',
      getDetectionStatus: jest.fn()
    } as any);

    render(<VaultList />);

    // Check that multiple matches are displayed
    expect(screen.getByText(/2 matching credentials/)).toBeInTheDocument();
  });
});
