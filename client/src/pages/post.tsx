import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, Users, Clock, Heart, MessageCircle, Share2, ChevronDown, Filter, Search, Plus, ChevronRight, Home, UserPlus, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type User } from "@/lib/auth";

interface CPSSGroup {
  id: string;
  groupId: string;
  groupName: string;
  breadcrumbPath: string;
  groupType: string;
  country?: string;
  port?: string;
  suburb?: string;
  service?: string;
  description?: string;
  memberCount: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface CPSSGroupPost {
  id: string;
  postId: string;
  groupId: string;
  userId: string;
  userName: string;
  content: string;
  postType: string;
  attachments: string[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PostProps {
  user: User;
}

export default function Post({ user }: PostProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<CPSSGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Fetch all available groups
  const { data: allGroups = [], isLoading: groupsLoading } = useQuery<{ groups: CPSSGroup[] }>({
    queryKey: ['/api/cpss/groups'],
  });

  // Fetch user's joined groups
  const { data: userGroupsData, isLoading: userGroupsLoading } = useQuery<{ groups: CPSSGroup[] }>({
    queryKey: ['/api/cpss/groups/my-groups'],
  });

  // Fetch posts for selected group
  const { data: postsData, isLoading: postsLoading } = useQuery<{ posts: CPSSGroupPost[] }>({
    queryKey: ['/api/cpss/groups', selectedGroup?.groupId, 'posts'],
    enabled: !!selectedGroup?.groupId,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest(`/api/cpss/groups/${groupId}/join`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cpss/groups/my-groups'] });
      toast({
        title: "Joined Group",
        description: "Welcome to the group! You can now participate in discussions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join",
        description: error.message || "Could not join the group",
        variant: "destructive",
      });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; postType: string }) => {
      return apiRequest(`/api/cpss/groups/${selectedGroup?.groupId}/posts`, 'POST', postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cpss/groups', selectedGroup?.groupId, 'posts'] });
      setNewPostContent("");
      setIsCreatePostOpen(false);
      toast({
        title: "Post Created",
        description: "Your message has been shared with the group.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Post",
        description: error.message || "Could not create post",
        variant: "destructive",
      });
    },
  });

  const handleJoinGroup = async (group: CPSSGroup) => {
    await joinGroupMutation.mutateAsync(group.groupId);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Content Required",
        description: "Please write something to share",
        variant: "destructive",
      });
      return;
    }

    await createPostMutation.mutateAsync({
      content: newPostContent,
      postType: "discussion"
    });
  };

  const userGroups = userGroupsData?.groups || [];
  const groups = allGroups?.groups || [];
  const posts = postsData?.posts || [];

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.breadcrumbPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span className="font-semibold text-navy">QaaqConnect</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">Ch16 Broadcast</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-groups">My Groups ({userGroups.length})</TabsTrigger>
            <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          </TabsList>

          {/* My Groups Tab */}
          <TabsContent value="my-groups">
            {selectedGroup ? (
              /* Group View */
              <div className="space-y-6">
                {/* Group Header */}
                <div className="bg-white rounded-lg p-6 border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedGroup(null)}
                        className="mb-3 -ml-2"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Groups
                      </Button>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>CPSS Navigation:</span>
                        {selectedGroup.breadcrumbPath.split(' > ').map((crumb, index, arr) => (
                          <span key={index} className="flex items-center gap-1">
                            <span className="font-medium">{crumb}</span>
                            {index < arr.length - 1 && <ChevronRight className="w-3 h-3" />}
                          </span>
                        ))}
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedGroup.groupName}</h2>
                      {selectedGroup.description && (
                        <p className="text-gray-600 mb-3">{selectedGroup.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{selectedGroup.memberCount} members</span>
                        </div>
                        <Badge variant="outline">{selectedGroup.groupType}</Badge>
                      </div>
                    </div>
                    
                    <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          New Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Post in {selectedGroup.groupName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Share something with the group..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            rows={4}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreatePost} 
                              disabled={createPostMutation.isPending}
                            >
                              {createPostMutation.isPending ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Group Posts */}
                <div className="space-y-4">
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 border text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to start a discussion in this group!</p>
                      <Button onClick={() => setIsCreatePostOpen(true)}>
                        Create First Post
                      </Button>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <Card key={post.postId} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-navy text-white">
                                  {post.userName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{post.userName}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(post.createdAt)}
                                  {post.isPinned && <Badge variant="outline" className="text-xs">Pinned</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-800 mb-4">{post.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-red-500">
                              <Heart className="w-4 h-4" />
                              <span>{post.likesCount}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentsCount}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-green-500">
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Groups List */
              <div className="space-y-6">
                {userGroupsLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 border text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups joined yet</h3>
                    <p className="text-gray-600 mb-4">Join groups to participate in location-based maritime discussions.</p>
                    <Button variant="outline">
                      Discover Groups
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userGroups.map((group) => (
                      <Card key={group.groupId} className="border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedGroup(group)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-3 h-3" />
                                <span>{group.breadcrumbPath}</span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.groupName}</h3>
                              {group.description && (
                                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{group.memberCount} members</span>
                                </div>
                                <Badge variant="outline">{group.groupType}</Badge>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Discover Groups Tab */}
          <TabsContent value="discover">
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search groups by location or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Available Groups */}
              {groupsLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg p-6 border animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredGroups.map((group) => {
                    const isJoined = userGroups.some(ug => ug.groupId === group.groupId);
                    
                    return (
                      <Card key={group.groupId} className="border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-3 h-3" />
                                <span>{group.breadcrumbPath}</span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.groupName}</h3>
                              {group.description && (
                                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{group.memberCount} members</span>
                                </div>
                                <Badge variant="outline">{group.groupType}</Badge>
                              </div>
                            </div>
                            <div className="ml-4">
                              {isJoined ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Joined
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleJoinGroup(group)}
                                  disabled={joinGroupMutation.isPending}
                                  className="flex items-center gap-2"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  {joinGroupMutation.isPending ? "Joining..." : "Join"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}