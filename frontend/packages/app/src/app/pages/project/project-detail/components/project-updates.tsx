/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import {
  Input,
  TextEditor,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Typography,
  Comments,
  type Comment,
} from "@next-pms/design-system/components";
import type { User } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Calendar, Send, Edit3, X } from "lucide-react";

/**
 * Internal dependencies
 */
import { mergeClassNames } from "@/lib/utils";

interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    email?: string;
  };
  createdAt: string;
  lastEditedAt?: string;
  status: string;
}

interface ProjectUpdatesProps {
  projectId?: string;
  className?: string;
}

const mockComments: Comment[] = [
  {
    id: "1",
    userImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    userName: "Alex Johnson",
    content:
      "<p>Great progress on the e-commerce platform! The UI wireframes look really promising. Looking forward to seeing the frontend development begin.</p>",
    createdAt: "2025-01-15T09:30:00Z",
    canEdit: true,
    canDelete: false,
  },
  {
    id: "2",
    userImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    userName: "Sarah Wilson",
    content:
      '<p>The technical architecture design looks solid. Have we considered implementing <strong>microservices</strong> for better scalability?</p><p>Also, <span class="mention" data-index="0" data-denotation-char="@" data-id="5" data-value="John Doe">@John Doe</span> what\'s our timeline for the CI/CD pipeline setup?</p>',
    createdAt: "2025-01-15T11:45:00Z",
    updatedAt: "2025-01-15T12:00:00Z",
    canEdit: false,
    canDelete: false,
  },
  {
    id: "3",
    userImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    userName: "Mike Chen",
    content:
      '<p><span class="mention" data-index="0" data-denotation-char="@" data-id="1" data-value="Alex Johnson">@Alex Johnson</span> I can help with the frontend development once the technical specs are finalized. Should we start setting up the development environment for the team?</p>',
    createdAt: "2025-01-15T14:20:00Z",
    canEdit: true,
    canDelete: true,
  },
  {
    id: "4",
    userImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    userName: "Emma Davis",
    content:
      '<p>The requirements gathering phase was thorough. I\'ve reviewed the documentation and everything looks comprehensive.</p><p><span class="mention" data-index="0" data-denotation-char="@" data-id="2" data-value="Sarah Wilson">@Sarah Wilson</span> <span class="mention" data-index="1" data-denotation-char="@" data-id="1" data-value="Alex Johnson">@Alex Johnson</span> <em>Ready to move to the next phase!</em></p>',
    createdAt: "2025-01-15T16:10:00Z",
    canEdit: false,
    canDelete: false,
  },
];

const mockProjectUpdate: ProjectUpdate = {
  id: "1",
  title: "E-commerce Platform Development Project",
  description:
    "<p>This project focuses on developing a comprehensive e-commerce platform with modern features and seamless user experience.</p><p><strong>Current Progress:</strong></p><ul><li>Initial requirements gathering completed</li><li>Technical architecture design in progress</li><li>UI/UX wireframes under review</li><li>Development environment setup</li></ul><p><strong>Next Steps:</strong></p><ul><li>Finalize technical specifications</li><li>Begin frontend development</li><li>Set up CI/CD pipeline</li></ul>",
  author: {
    name: "John Doe",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    email: "john.doe@company.com",
  },
  createdAt: "2025-08-15T10:00:00Z",
  lastEditedAt: "2025-08-25T14:30:00Z",
  status: "Draft",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

const ProjectUpdates = ({ projectId, className }: ProjectUpdatesProps) => {
  console.log(projectId);
  const [projectUpdate, setProjectUpdate] = useState<ProjectUpdate>(mockProjectUpdate);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState(projectUpdate.title);
  const [editDescription, setEditDescription] = useState(projectUpdate.description);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [cachedUsers, setCachedUsers] = useState<User[]>([]);

  // Fetch users using useFrappeGetCall
  const { data: usersData } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "User",
      fields: ["name", "full_name"],
      filters: [
        ["enabled", "=", 1],
        ["user_type", "=", "System User"],
        ...(userSearchTerm ? [["full_name", "like", `%${userSearchTerm}%`]] : []),
      ],
      limit_page_length: 20,
    },
    userSearchTerm ? undefined : null
  );

  useEffect(() => {
    if (usersData?.message && usersData.message.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const users: User[] = usersData.message.map((user: any) => ({
        id: user.name,
        value: user.full_name || user.name,
      }));
      setCachedUsers(users);
    } else if (usersData?.message) {
      setCachedUsers([]);
    }
  }, [usersData]);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      setProjectUpdate((prev) => ({
        ...prev,
        title: editTitle.trim(),
        lastEditedAt: new Date().toISOString(),
      }));
      setEditingTitle(false);
    }
  };

  const handleCancelTitle = () => {
    setEditTitle(projectUpdate.title);
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editDescription.trim()) {
      setProjectUpdate((prev) => ({
        ...prev,
        description: editDescription.trim(),
        lastEditedAt: new Date().toISOString(),
      }));
      setEditingDescription(false);
    }
  };

  const handleCancelDescription = () => {
    setEditDescription(projectUpdate.description);
    setEditingDescription(false);
  };

  const handleEditTitle = () => {
    setEditTitle(projectUpdate.title);
    setEditingTitle(true);
  };

  const handleEditDescription = () => {
    setEditDescription(projectUpdate.description);
    setEditingDescription(true);
  };

  const handleCommentSubmit = async (content: string): Promise<void> => {
    setIsSubmittingComment(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newComment: Comment = {
        id: Date.now().toString(),
        userImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        userName: "Current User",
        content,
        createdAt: new Date().toISOString(),
        canEdit: true,
        canDelete: true,
      };

      setComments((prev) => [...prev, newComment]);
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentUpdate = async (commentId: string, newContent: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, content: newContent, updatedAt: new Date().toISOString() } : comment
      )
    );
  };

  const handleCommentDelete = (commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  const handleFetchUsers = async (searchTerm: string): Promise<User[]> => {
    try {
      setUserSearchTerm(searchTerm);

      if (searchTerm.length === 0) {
        const result = cachedUsers.slice(0, 10);
        return result;
      } else {
        const filteredUsers = cachedUsers.filter((user) => user.value.toLowerCase().includes(searchTerm.toLowerCase()));
        const result = filteredUsers.slice(0, 10);
        return result;
      }
    } catch (error) {
      console.error("Error fetching users from Frappe:", error);
    }
    return [];
  };

  return (
    <div className={mergeClassNames("w-full", className)}>
      <div className="w-full bg-white">
        <div className="px-8 max-md:px-3 py-6 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-9 w-9 ring-2 ring-blue-100">
                <AvatarImage src={projectUpdate.author.avatar} alt={projectUpdate.author.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {getInitials(projectUpdate.author.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-gray-900">{projectUpdate.author.name}</p>
                <p className="text-xs text-gray-500 text-wrap">{projectUpdate.author.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {projectUpdate?.status}
            </span>
          </div>

          <div className="group">
            {editingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-4xl max-md:text-xl font-bold border-0 border-b-2 focus-visible:border-blue-500 rounded-none px-0 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none"
                placeholder="Enter project title..."
                autoFocus
              />
            ) : (
              <div className="flex items-center group cursor-pointer" onClick={handleEditTitle}>
                <Typography variant="h1" className="text-4xl max-md:text-2xl font-bold text-gray-900 flex-1 py-2">
                  {projectUpdate.title}
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-4"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          {editingDescription ? (
            <div className="w-full">
              <div className="bg-white mx-8 max-md:mx-3 max-md:mx-3 mt-3 rounded-lg border c overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <TextEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Start writing your project update..."
                  className="min-h-[30rem] border-0"
                />
              </div>
            </div>
          ) : (
            <div className="group cursor-pointer" onClick={handleEditDescription}>
              <div className="bg-white mx-8 max-md:mx-3 pt-4 pb-2 overflow-hidden transition-colors duration-200 flex flex-col items-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
                <div className="w-full">
                  <TextEditor
                    value={projectUpdate.description}
                    onChange={() => {}}
                    hideToolbar={true}
                    className="min-h-[400px] max-h-fit border-0 [&_.ql-editor]:cursor-pointer [&_.ql-editor]:bg-transparent [&_.ql-editor]:px-0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mx-8 max-md:mx-3  mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between max-md:flex-col max-md:gap-4 w-full">
              <div className="flex items-center truncate max-md:w-full  max-md:flex-col gap-3 text-sm text-gray-500">
                <div className="flex gap-1 w-full">
                  <Calendar className="h-4 w-4" />
                  <Typography variant="p" className="text-gray-500 max-md:text-xs">
                    Created {getTimeAgo(projectUpdate.createdAt)}
                  </Typography>
                </div>
                {projectUpdate.lastEditedAt && (
                  <div className="flex gap-1 w-full">
                    <Edit3 className="h-4 w-4" />
                    <Typography variant="p" className="text-gray-500 max-md:text-xs">
                      Last edited {getTimeAgo(projectUpdate.lastEditedAt)}
                    </Typography>
                  </div>
                )}
              </div>

              {(editingDescription || editingTitle) && (
                <div className="flex items-center gap-3 max-md:w-full max-md:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (editingTitle) {
                        handleCancelTitle();
                      }
                      if (editingDescription) {
                        handleCancelDescription();
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                    disabled={editingTitle ? !editTitle.trim() : !editDescription.trim()}
                    onClick={() => {
                      if (editingTitle) {
                        handleSaveTitle();
                      }
                      if (editingDescription) {
                        handleSaveDescription();
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {projectUpdate?.status === "Draft" && (
          <div className="mx-8 max-md:mx-3 pb-8">
            <Comments
              comments={comments}
              onSubmit={handleCommentSubmit}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              isSubmitting={isSubmittingComment}
              title="Comments"
              placeholder="Share your thoughts on this project update..."
              className="mt-8"
              maxHeight="500px"
              enableMentions={true}
              onFetchUsers={handleFetchUsers}
              mentionClassName="bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-semibold border border-green-200 whitespace-nowrap inline-block cursor-pointer hover:bg-green-100"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectUpdates;
