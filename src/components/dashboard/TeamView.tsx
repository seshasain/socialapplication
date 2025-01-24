import React from 'react';
import { Users, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TRIAL_LIMITS } from '../../types/trial';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
}

export default function TeamView() {
  const { user } = useAuth();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [showInviteForm, setShowInviteForm] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const isTrialUser = user?.subscription?.status === 'trial';
  const isMemberLimitReached = isTrialUser && members.length >= TRIAL_LIMITS.maxTeamMembers;

  React.useEffect(() => {
    // Mock data - replace with actual API call
    setMembers([
      {
        id: '1',
        name: user?.name || 'Current User',
        email: user?.email || '',
        role: 'admin',
        status: 'active'
      }
    ]);
    setIsLoading(false);
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMemberLimitReached) {
      setError('You have reached the maximum team members limit for trial accounts');
      return;
    }

    try {
      // TODO: Implement API call to invite team member
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMembers([...members, {
        id: Date.now().toString(),
        name: '',
        email: inviteEmail,
        role: inviteRole,
        status: 'pending'
      }]);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setError('Failed to send invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <button
          onClick={() => setShowInviteForm(true)}
          disabled={isMemberLimitReached}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      {isTrialUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Trial accounts are limited to {TRIAL_LIMITS.maxTeamMembers} team member
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showInviteForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name || 'Pending'}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 capitalize">{member.role}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {member.status === 'active' ? (
                      'Active'
                    ) : (
                      <span className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        Invited
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {member.role !== 'admin' && (
                    <button className="text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 