import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Brain,
  MessageSquare,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Shield,
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Upload,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Target,
  BarChart3,
  MessageCircle,
  Headphones,
  UserCheck,
  Coffee,
  Calendar,
  Timer,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from "lucide-react";

interface AIEmployee {
  id: string;
  name: string;
  avatar: string;
  role:
    | "customer_support"
    | "game_host"
    | "vip_manager"
    | "security"
    | "analytics"
    | "content_moderator";
  status: "active" | "training" | "offline" | "maintenance";
  personality: {
    friendliness: number; // 1-10
    professionalism: number; // 1-10
    empathy: number; // 1-10
    humor: number; // 1-10
    assertiveness: number; // 1-10
  };
  capabilities: {
    languages: string[];
    specialties: string[];
    responseTime: number; // milliseconds
    accuracy: number; // percentage
    learningRate: number; // percentage
  };
  performance: {
    conversationsToday: number;
    averageRating: number;
    resolutionRate: number;
    escalationRate: number;
    responseTime: number;
    uptime: number;
  };
  schedule: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
    };
    availableDays: string[];
  };
  training: {
    currentLevel: number;
    experience: number;
    skillPoints: number;
    completedCourses: string[];
    certifications: string[];
  };
  settings: {
    autoRespond: boolean;
    escalationRules: string[];
    maxConcurrentChats: number;
    customInstructions: string;
    knowledgeBase: string[];
  };
  createdAt: Date;
  lastActive: Date;
  totalInteractions: number;
  successRate: number;
}

interface AIEmployeeManagerProps {
  onEmployeeSelect?: (employee: AIEmployee) => void;
  selectedEmployeeId?: string;
}

export function AIEmployeeManager({
  onEmployeeSelect,
  selectedEmployeeId,
}: AIEmployeeManagerProps) {
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(
    null,
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "customer_support" as AIEmployee["role"],
    personality: {
      friendliness: 8,
      professionalism: 8,
      empathy: 7,
      humor: 5,
      assertiveness: 6,
    },
  });

  useEffect(() => {
    loadAIEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find((e) => e.id === selectedEmployeeId);
      if (employee) {
        setSelectedEmployee(employee);
      }
    }
  }, [selectedEmployeeId, employees]);

  const loadAIEmployees = () => {
    // Mock AI employees data
    const mockEmployees: AIEmployee[] = [
      {
        id: "ai_001",
        name: "Sarah",
        avatar: "👩‍💼",
        role: "customer_support",
        status: "active",
        personality: {
          friendliness: 9,
          professionalism: 8,
          empathy: 9,
          humor: 6,
          assertiveness: 5,
        },
        capabilities: {
          languages: ["English", "Spanish", "French"],
          specialties: ["Account Issues", "Payment Support", "Game Rules"],
          responseTime: 1200,
          accuracy: 94,
          learningRate: 87,
        },
        performance: {
          conversationsToday: 127,
          averageRating: 4.6,
          resolutionRate: 89,
          escalationRate: 8,
          responseTime: 1150,
          uptime: 99.2,
        },
        schedule: {
          timezone: "EST",
          workingHours: { start: "09:00", end: "17:00" },
          availableDays: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
        },
        training: {
          currentLevel: 8,
          experience: 2340,
          skillPoints: 145,
          completedCourses: [
            "Customer Service 101",
            "Conflict Resolution",
            "Payment Processing",
          ],
          certifications: ["Level 1 Support", "Payment Specialist"],
        },
        settings: {
          autoRespond: true,
          escalationRules: [
            "Withdrawal > $500",
            "Account Locked",
            "Fraud Suspicion",
          ],
          maxConcurrentChats: 5,
          customInstructions:
            "Always verify identity before discussing account details.",
          knowledgeBase: ["FAQ", "Account Procedures", "Payment Methods"],
        },
        createdAt: new Date("2024-01-15"),
        lastActive: new Date(),
        totalInteractions: 15420,
        successRate: 91,
      },
      {
        id: "ai_002",
        name: "Marcus",
        avatar: "👨‍🎯",
        role: "game_host",
        status: "active",
        personality: {
          friendliness: 8,
          professionalism: 7,
          empathy: 6,
          humor: 9,
          assertiveness: 7,
        },
        capabilities: {
          languages: ["English", "German"],
          specialties: ["Poker", "Blackjack", "Slots", "Live Games"],
          responseTime: 800,
          accuracy: 97,
          learningRate: 82,
        },
        performance: {
          conversationsToday: 89,
          averageRating: 4.8,
          resolutionRate: 95,
          escalationRate: 3,
          responseTime: 750,
          uptime: 98.7,
        },
        schedule: {
          timezone: "EST",
          workingHours: { start: "18:00", end: "02:00" },
          availableDays: ["Friday", "Saturday", "Sunday"],
        },
        training: {
          currentLevel: 9,
          experience: 3100,
          skillPoints: 189,
          completedCourses: [
            "Game Rules Mastery",
            "Entertainment Hosting",
            "Player Engagement",
          ],
          certifications: ["Game Host Pro", "Live Dealer Certified"],
        },
        settings: {
          autoRespond: true,
          escalationRules: [
            "Cheating Accusation",
            "Technical Issues",
            "Player Disputes",
          ],
          maxConcurrentChats: 3,
          customInstructions:
            "Keep conversations fun and engaging while maintaining game integrity.",
          knowledgeBase: [
            "Game Rules",
            "Odds & Probabilities",
            "Tournament Procedures",
          ],
        },
        createdAt: new Date("2024-01-10"),
        lastActive: new Date(Date.now() - 30 * 60 * 1000),
        totalInteractions: 8750,
        successRate: 96,
      },
      {
        id: "ai_003",
        name: "Elena",
        avatar: "👩‍⚖️",
        role: "vip_manager",
        status: "active",
        personality: {
          friendliness: 9,
          professionalism: 10,
          empathy: 8,
          humor: 4,
          assertiveness: 8,
        },
        capabilities: {
          languages: ["English", "Italian", "Portuguese"],
          specialties: [
            "VIP Services",
            "High Roller Support",
            "Exclusive Events",
          ],
          responseTime: 500,
          accuracy: 98,
          learningRate: 91,
        },
        performance: {
          conversationsToday: 34,
          averageRating: 4.9,
          resolutionRate: 97,
          escalationRate: 2,
          responseTime: 480,
          uptime: 99.8,
        },
        schedule: {
          timezone: "EST",
          workingHours: { start: "12:00", end: "20:00" },
          availableDays: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        training: {
          currentLevel: 10,
          experience: 4500,
          skillPoints: 234,
          completedCourses: [
            "VIP Relations",
            "Luxury Service",
            "High-Value Customer Management",
          ],
          certifications: ["VIP Specialist", "Premium Service Excellence"],
        },
        settings: {
          autoRespond: false,
          escalationRules: ["VIP Complaint", "Large Withdrawal Request"],
          maxConcurrentChats: 2,
          customInstructions:
            "Provide white-glove service with personal attention to detail.",
          knowledgeBase: [
            "VIP Benefits",
            "Exclusive Offers",
            "Premium Services",
          ],
        },
        createdAt: new Date("2024-01-05"),
        lastActive: new Date(Date.now() - 15 * 60 * 1000),
        totalInteractions: 1250,
        successRate: 98,
      },
      {
        id: "ai_004",
        name: "Alex",
        avatar: "🛡️",
        role: "security",
        status: "training",
        personality: {
          friendliness: 6,
          professionalism: 10,
          empathy: 5,
          humor: 2,
          assertiveness: 9,
        },
        capabilities: {
          languages: ["English"],
          specialties: [
            "Fraud Detection",
            "Account Security",
            "Risk Assessment",
          ],
          responseTime: 300,
          accuracy: 99,
          learningRate: 95,
        },
        performance: {
          conversationsToday: 0,
          averageRating: 4.2,
          resolutionRate: 85,
          escalationRate: 15,
          responseTime: 280,
          uptime: 100,
        },
        schedule: {
          timezone: "EST",
          workingHours: { start: "00:00", end: "23:59" },
          availableDays: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        training: {
          currentLevel: 6,
          experience: 1200,
          skillPoints: 78,
          completedCourses: ["Security Protocols", "Fraud Detection Basics"],
          certifications: ["Security Level 1"],
        },
        settings: {
          autoRespond: true,
          escalationRules: ["High Risk Transaction", "Multiple Failed Logins"],
          maxConcurrentChats: 10,
          customInstructions:
            "Prioritize security over customer satisfaction when necessary.",
          knowledgeBase: [
            "Security Procedures",
            "Fraud Patterns",
            "Risk Indicators",
          ],
        },
        createdAt: new Date("2024-01-22"),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        totalInteractions: 450,
        successRate: 87,
      },
    ];

    setEmployees(mockEmployees);
  };

  const roleLabels = {
    customer_support: "Customer Support",
    game_host: "Game Host",
    vip_manager: "VIP Manager",
    security: "Security",
    analytics: "Analytics",
    content_moderator: "Content Moderator",
  };

  const statusColors = {
    active: "text-green-500 bg-green-500/10",
    training: "text-yellow-500 bg-yellow-500/10",
    offline: "text-gray-500 bg-gray-500/10",
    maintenance: "text-orange-500 bg-orange-500/10",
  };

  const createAIEmployee = () => {
    const employee: AIEmployee = {
      id: `ai_${Date.now().toString().slice(-3)}`,
      name: newEmployee.name,
      avatar: "🤖",
      role: newEmployee.role,
      status: "training",
      personality: newEmployee.personality,
      capabilities: {
        languages: ["English"],
        specialties: [],
        responseTime: 1000,
        accuracy: 70,
        learningRate: 85,
      },
      performance: {
        conversationsToday: 0,
        averageRating: 0,
        resolutionRate: 0,
        escalationRate: 0,
        responseTime: 0,
        uptime: 0,
      },
      schedule: {
        timezone: "EST",
        workingHours: { start: "09:00", end: "17:00" },
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      training: {
        currentLevel: 1,
        experience: 0,
        skillPoints: 0,
        completedCourses: [],
        certifications: [],
      },
      settings: {
        autoRespond: true,
        escalationRules: [],
        maxConcurrentChats: 3,
        customInstructions: "",
        knowledgeBase: [],
      },
      createdAt: new Date(),
      lastActive: new Date(),
      totalInteractions: 0,
      successRate: 0,
    };

    setEmployees([...employees, employee]);
    setNewEmployee({
      name: "",
      role: "customer_support",
      personality: {
        friendliness: 8,
        professionalism: 8,
        empathy: 7,
        humor: 5,
        assertiveness: 6,
      },
    });
    setShowCreateDialog(false);
  };

  const updateEmployeeStatus = (
    employeeId: string,
    status: AIEmployee["status"],
  ) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? { ...emp, status, lastActive: new Date() }
          : emp,
      ),
    );

    if (selectedEmployee?.id === employeeId) {
      setSelectedEmployee((prev) =>
        prev ? { ...prev, status, lastActive: new Date() } : null,
      );
    }
  };

  const trainEmployee = (employeeId: string, course: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              training: {
                ...emp.training,
                completedCourses: [...emp.training.completedCourses, course],
                experience: emp.training.experience + 100,
                skillPoints: emp.training.skillPoints + 10,
                currentLevel:
                  emp.training.currentLevel +
                  (emp.training.experience + 100 >
                  emp.training.currentLevel * 500
                    ? 1
                    : 0),
              },
            }
          : emp,
      ),
    );
  };

  const getPerformanceColor = (value: number, reverse = false) => {
    if (reverse) {
      return value < 30
        ? "text-green-500"
        : value < 70
          ? "text-yellow-500"
          : "text-red-500";
    }
    return value >= 80
      ? "text-green-500"
      : value >= 60
        ? "text-yellow-500"
        : "text-red-500";
  };

  const handleEmployeeSelect = (employee: AIEmployee) => {
    setSelectedEmployee(employee);
    onEmployeeSelect?.(employee);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              AI Employee Manager
            </h2>
            <p className="text-muted-foreground">
              Manage and monitor your AI-powered virtual employees
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create AI Employee
            </Button>
            <Button onClick={loadAIEmployees} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Bot className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-sm text-muted-foreground">
                Total Employees
              </div>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-sm text-muted-foreground">Active Now</div>
              <div className="text-2xl font-bold text-green-500">
                {employees.filter((e) => e.status === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-sm text-muted-foreground">
                Conversations Today
              </div>
              <div className="text-2xl font-bold text-purple-500">
                {employees.reduce(
                  (sum, e) => sum + e.performance.conversationsToday,
                  0,
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-gold" />
              <div className="text-sm text-muted-foreground">Avg Rating</div>
              <div className="text-2xl font-bold text-gold">
                {(
                  employees.reduce(
                    (sum, e) => sum + e.performance.averageRating,
                    0,
                  ) / employees.length
                ).toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => handleEmployeeSelect(employee)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{employee.avatar}</div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription>
                        {roleLabels[employee.role]}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={statusColors[employee.status]}>
                    {employee.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Rating</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 text-gold" />
                      {employee.performance.averageRating.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Resolution</div>
                    <div
                      className={`font-semibold ${getPerformanceColor(employee.performance.resolutionRate)}`}
                    >
                      {employee.performance.resolutionRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Chats Today</div>
                    <div className="font-semibold">
                      {employee.performance.conversationsToday}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Level</div>
                    <div className="font-semibold text-purple-500">
                      {employee.training.currentLevel}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateEmployeeStatus(
                            employee.id,
                            employee.status === "active" ? "offline" : "active",
                          );
                        }}
                      >
                        {employee.status === "active" ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {employee.status === "active"
                        ? "Set Offline"
                        : "Set Active"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(employee);
                          setShowTrainingDialog(true);
                        }}
                      >
                        <GraduationCap className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Training</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmployeeSelect(employee);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                  </Tooltip>
                </div>

                {/* Status Indicator */}
                <div className="text-xs text-muted-foreground">
                  Last active:{" "}
                  {`${Math.floor((Date.now() - employee.lastActive.getTime()) / 60000)}m ago`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Employee Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New AI Employee</DialogTitle>
              <DialogDescription>
                Set up a new AI employee with custom personality and role
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Employee Name</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, name: e.target.value })
                  }
                  placeholder="Enter employee name"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value) =>
                    setNewEmployee({
                      ...newEmployee,
                      role: value as AIEmployee["role"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_support">
                      Customer Support
                    </SelectItem>
                    <SelectItem value="game_host">Game Host</SelectItem>
                    <SelectItem value="vip_manager">VIP Manager</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="content_moderator">
                      Content Moderator
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Personality Traits</Label>

                {Object.entries(newEmployee.personality).map(
                  ([trait, value]) => (
                    <div key={trait} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm capitalize">{trait}</span>
                        <span className="text-sm font-medium">{value}/10</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={(values) =>
                          setNewEmployee({
                            ...newEmployee,
                            personality: {
                              ...newEmployee.personality,
                              [trait]: values[0],
                            },
                          })
                        }
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ),
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createAIEmployee} className="flex-1">
                  Create Employee
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Training Dialog */}
        <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>AI Employee Training</DialogTitle>
              <DialogDescription>
                Enhance {selectedEmployee?.name}'s skills and capabilities
              </DialogDescription>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">{selectedEmployee.avatar}</div>
                  <div className="font-semibold">{selectedEmployee.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Level {selectedEmployee.training.currentLevel} •{" "}
                    {selectedEmployee.training.experience} XP
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress to Next Level</span>
                      <span>
                        {selectedEmployee.training.experience % 500}/500 XP
                      </span>
                    </div>
                    <Progress
                      value={(selectedEmployee.training.experience % 500) / 5}
                    />
                  </div>

                  <div>
                    <Label>Available Training Courses</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        "Advanced Communication",
                        "Conflict Resolution",
                        "Customer Psychology",
                        "Technical Troubleshooting",
                        "Sales Techniques",
                      ]
                        .filter(
                          (course) =>
                            !selectedEmployee.training.completedCourses.includes(
                              course,
                            ),
                        )
                        .map((course) => (
                          <Button
                            key={course}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              trainEmployee(selectedEmployee.id, course);
                              setShowTrainingDialog(false);
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            {course}
                            <Badge className="ml-auto">+100 XP</Badge>
                          </Button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <Label>Completed Courses</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedEmployee.training.completedCourses.map(
                        (course) => (
                          <Badge
                            key={course}
                            variant="secondary"
                            className="text-xs"
                          >
                            {course}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowTrainingDialog(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Employee Details Dialog */}
        {selectedEmployee && (
          <Dialog
            open={!!selectedEmployee}
            onOpenChange={() => setSelectedEmployee(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="text-2xl">{selectedEmployee.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedEmployee.name}
                      <Badge className={statusColors[selectedEmployee.status]}>
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {roleLabels[selectedEmployee.role]} • Level{" "}
                      {selectedEmployee.training.currentLevel}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-sm text-muted-foreground">
                          Total Interactions
                        </div>
                        <div className="text-xl font-bold">
                          {selectedEmployee.totalInteractions.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="text-sm text-muted-foreground">
                          Success Rate
                        </div>
                        <div className="text-xl font-bold text-green-500">
                          {selectedEmployee.successRate}%
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <div className="text-sm text-muted-foreground">
                          Avg Response Time
                        </div>
                        <div className="text-xl font-bold text-purple-500">
                          {selectedEmployee.capabilities.responseTime}ms
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Languages</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEmployee.capabilities.languages.map(
                            (lang) => (
                              <Badge key={lang} variant="outline">
                                {lang}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Specialties</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEmployee.capabilities.specialties.map(
                            (specialty) => (
                              <Badge key={specialty} variant="secondary">
                                {specialty}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Accuracy</Label>
                          <div className="text-lg font-semibold">
                            {selectedEmployee.capabilities.accuracy}%
                          </div>
                        </div>
                        <div>
                          <Label>Learning Rate</Label>
                          <div className="text-lg font-semibold">
                            {selectedEmployee.capabilities.learningRate}%
                          </div>
                        </div>
                        <div>
                          <Label>Max Concurrent</Label>
                          <div className="text-lg font-semibold">
                            {selectedEmployee.settings.maxConcurrentChats}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-muted-foreground">
                          Today's Chats
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedEmployee.performance.conversationsToday}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-muted-foreground">
                          Avg Rating
                        </div>
                        <div className="text-2xl font-bold text-gold">
                          {selectedEmployee.performance.averageRating.toFixed(
                            1,
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-muted-foreground">
                          Resolution Rate
                        </div>
                        <div className="text-2xl font-bold text-green-500">
                          {selectedEmployee.performance.resolutionRate}%
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-muted-foreground">
                          Uptime
                        </div>
                        <div className="text-2xl font-bold text-blue-500">
                          {selectedEmployee.performance.uptime.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Resolution Rate</span>
                          <span className="font-semibold">
                            {selectedEmployee.performance.resolutionRate}%
                          </span>
                        </div>
                        <Progress
                          value={selectedEmployee.performance.resolutionRate}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Customer Satisfaction</span>
                          <span className="font-semibold">
                            {(
                              selectedEmployee.performance.averageRating * 20
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            selectedEmployee.performance.averageRating * 20
                          }
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Escalation Rate (Lower is Better)</span>
                          <span className="font-semibold">
                            {selectedEmployee.performance.escalationRate}%
                          </span>
                        </div>
                        <Progress
                          value={
                            100 - selectedEmployee.performance.escalationRate
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="personality" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personality Profile</CardTitle>
                      <CardDescription>
                        Personality traits that define this AI employee's
                        interaction style
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(selectedEmployee.personality).map(
                        ([trait, value]) => (
                          <div key={trait} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="capitalize font-medium">
                                {trait}
                              </span>
                              <span className="text-sm">{value}/10</span>
                            </div>
                            <Progress value={value * 10} />
                          </div>
                        ),
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="training" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Training Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-500">
                            {selectedEmployee.training.currentLevel}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current Level
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {selectedEmployee.training.experience.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Experience Points
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {selectedEmployee.training.skillPoints}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Skill Points
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Progress to Next Level</span>
                          <span>
                            {selectedEmployee.training.experience % 500}/500 XP
                          </span>
                        </div>
                        <Progress
                          value={
                            (selectedEmployee.training.experience % 500) / 5
                          }
                        />
                      </div>

                      <div>
                        <Label>Completed Courses</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedEmployee.training.completedCourses.map(
                            (course) => (
                              <Badge key={course} variant="secondary">
                                {course}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Certifications</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedEmployee.training.certifications.map(
                            (cert) => (
                              <Badge key={cert} className="bg-gold text-black">
                                {cert}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Auto Respond</Label>
                        <Switch
                          checked={selectedEmployee.settings.autoRespond}
                          disabled
                        />
                      </div>

                      <div>
                        <Label>Working Hours</Label>
                        <div className="text-sm mt-1">
                          {selectedEmployee.schedule.workingHours.start} -{" "}
                          {selectedEmployee.schedule.workingHours.end} (
                          {selectedEmployee.schedule.timezone})
                        </div>
                      </div>

                      <div>
                        <Label>Available Days</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedEmployee.schedule.availableDays.map(
                            (day) => (
                              <Badge key={day} variant="outline">
                                {day}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Escalation Rules</Label>
                        <div className="space-y-1 mt-1">
                          {selectedEmployee.settings.escalationRules.map(
                            (rule, index) => (
                              <div
                                key={index}
                                className="text-sm p-2 bg-muted rounded"
                              >
                                {rule}
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Custom Instructions</Label>
                        <Textarea
                          value={selectedEmployee.settings.customInstructions}
                          disabled
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
