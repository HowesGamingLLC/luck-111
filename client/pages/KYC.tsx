import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Upload,
  FileText,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Eye,
  Download,
} from "lucide-react";

interface KYCDocument {
  type: "id" | "address" | "selfie";
  name: string;
  file?: File;
  uploaded?: boolean;
  status: "pending" | "uploaded" | "verified" | "rejected";
  rejectionReason?: string;
}

export default function KYC() {
  const { user, updateKYCStatus } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<KYCDocument[]>([
    {
      type: "id",
      name: "Government-issued ID",
      status: "pending",
    },
    {
      type: "address",
      name: "Proof of Address",
      status: "pending",
    },
    {
      type: "selfie",
      name: "Selfie Verification",
      status: "pending",
    },
  ]);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getKYCStatusInfo = () => {
    if (!user)
      return {
        icon: XCircle,
        text: "Unknown",
        color: "text-gray-500",
        description: "",
      };

    switch (user.kycStatus) {
      case "approved":
        return {
          icon: CheckCircle,
          text: "Verified",
          color: "text-green-500",
          description:
            "Your identity has been successfully verified. You can now make withdrawals.",
        };
      case "pending":
        return {
          icon: Clock,
          text: "Under Review",
          color: "text-yellow-500",
          description:
            "Your documents are being reviewed. This usually takes 1-2 business days.",
        };
      case "rejected":
        return {
          icon: XCircle,
          text: "Rejected",
          color: "text-red-500",
          description:
            "Your verification was rejected. Please check the reasons below and resubmit.",
        };
      default:
        return {
          icon: AlertTriangle,
          text: "Not Started",
          color: "text-orange-500",
          description:
            "Complete the verification process to enable withdrawals and increase your limits.",
        };
    }
  };

  const handleFileUpload = (type: "id" | "address" | "selfie", file: File) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.type === type ? { ...doc, file, status: "uploaded" as const } : doc,
      ),
    );
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return Object.values(personalInfo).every(
          (value) => value.trim() !== "",
        );
      case 2:
        return documents.every((doc) => doc.status === "uploaded");
      default:
        return true;
    }
  };

  const handleSubmitKYC = async () => {
    setIsSubmitting(true);

    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update KYC status to pending
    updateKYCStatus("pending");

    setIsSubmitting(false);

    // Navigate to dashboard with success message
    navigate("/dashboard", {
      state: { message: "KYC verification submitted successfully!" },
    });
  };

  const kycStatus = getKYCStatusInfo();
  const KYCIcon = kycStatus.icon;
  const completedSteps = documents.filter(
    (doc) => doc.status === "uploaded",
  ).length;
  const progress =
    user?.kycStatus === "not_submitted"
      ? (currentStep - 1) * 33.33 + (completedSteps / documents.length) * 33.33
      : 100;

  // If already verified, show status page
  if (user?.kycStatus === "approved") {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8">
        <div className="container max-w-2xl">
          <Card className="glass text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl gradient-text">
                Verification Complete!
              </CardTitle>
              <CardDescription>
                Your identity has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="font-semibold text-green-700 mb-2">
                  You're all set!
                </h3>
                <p className="text-sm text-green-600">
                  Your account is fully verified. You can now:
                </p>
                <ul className="text-sm text-green-600 mt-2 space-y-1">
                  <li>• Make withdrawals to your bank account</li>
                  <li>• Access higher betting limits</li>
                  <li>• Participate in exclusive promotions</li>
                  <li>• Enjoy priority customer support</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild className="btn-primary">
                  <a href="/withdraw">Make a Withdrawal</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/dashboard">Back to Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold gradient-text mb-4 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8" />
            Identity Verification
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Verify your identity to unlock withdrawals and enhanced features
          </p>
        </div>

        {/* Status Banner */}
        <Card
          className={`mb-8 border-${kycStatus.color.split("-")[1]}-500 bg-${kycStatus.color.split("-")[1]}-500/5`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <KYCIcon className={`h-8 w-8 ${kycStatus.color}`} />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{kycStatus.text}</h3>
                <p className="text-muted-foreground">{kycStatus.description}</p>
              </div>
              <Badge
                variant={
                  kycStatus.text === "Verified" ? "default" : "secondary"
                }
              >
                {kycStatus.text}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Verification Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${currentStep > 1 ? "bg-green-500" : currentStep === 1 ? "bg-blue-500" : "bg-gray-300"}`}
                  />
                  <span>Personal Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${currentStep > 2 ? "bg-green-500" : currentStep === 2 ? "bg-blue-500" : "bg-gray-300"}`}
                  />
                  <span>Document Upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${currentStep > 3 ? "bg-green-500" : currentStep === 3 ? "bg-blue-500" : "bg-gray-300"}`}
                  />
                  <span>Review & Submit</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Form */}
        <Tabs
          value={`step-${currentStep}`}
          onValueChange={(value) =>
            setCurrentStep(parseInt(value.split("-")[1]))
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step-1">Personal Information</TabsTrigger>
            <TabsTrigger value="step-2" disabled={!validateStep(1)}>
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="step-3"
              disabled={!validateStep(1) || !validateStep(2)}
            >
              Review
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Personal Information */}
          <TabsContent value="step-1">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Please provide your personal details exactly as they appear on
                  your government-issued ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) =>
                        handlePersonalInfoChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) =>
                        handlePersonalInfoChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={personalInfo.dateOfBirth}
                      onChange={(e) =>
                        handlePersonalInfoChange("dateOfBirth", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) =>
                        handlePersonalInfoChange("phone", e.target.value)
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) =>
                      handlePersonalInfoChange("address", e.target.value)
                    }
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={personalInfo.city}
                      onChange={(e) =>
                        handlePersonalInfoChange("city", e.target.value)
                      }
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      value={personalInfo.state}
                      onChange={(e) =>
                        handlePersonalInfoChange("state", e.target.value)
                      }
                      placeholder="Enter your state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                    <Input
                      id="zipCode"
                      value={personalInfo.zipCode}
                      onChange={(e) =>
                        handlePersonalInfoChange("zipCode", e.target.value)
                      }
                      placeholder="Enter your ZIP code"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <select
                    id="country"
                    value={personalInfo.country}
                    onChange={(e) =>
                      handlePersonalInfoChange("country", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                  </select>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Make sure all information matches exactly with your
                    government-issued ID. Any discrepancies may delay the
                    verification process.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!validateStep(1)}
                    className="btn-primary"
                  >
                    Continue to Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Document Upload */}
          <TabsContent value="step-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Upload clear photos of your documents. Make sure all text is
                  readable and images are well-lit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {documents.map((doc) => (
                  <div
                    key={doc.type}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {doc.type === "id" && (
                          <FileText className="h-5 w-5 text-blue-500" />
                        )}
                        {doc.type === "address" && (
                          <FileText className="h-5 w-5 text-green-500" />
                        )}
                        {doc.type === "selfie" && (
                          <Camera className="h-5 w-5 text-purple-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.type === "id" &&
                              "Driver's license, passport, or national ID"}
                            {doc.type === "address" &&
                              "Utility bill, bank statement, or lease agreement (within 3 months)"}
                            {doc.type === "selfie" &&
                              "Take a selfie holding your ID next to your face"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          doc.status === "uploaded" ? "default" : "secondary"
                        }
                      >
                        {doc.status === "uploaded" ? "Uploaded" : "Required"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(doc.type, file);
                          }
                        }}
                        className="flex-1"
                      />
                      {doc.status === "uploaded" && (
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      )}
                    </div>

                    {doc.status === "rejected" && doc.rejectionReason && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejected:</strong> {doc.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Document Requirements:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Images must be clear and readable</li>
                      <li>• All four corners of documents must be visible</li>
                      <li>• No screenshots or photocopies</li>
                      <li>• Files must be under 10MB each</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back to Personal Info
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep(2)}
                    className="btn-primary"
                  >
                    Continue to Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Review & Submit */}
          <TabsContent value="step-3">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Please review your information and documents before submitting
                  for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Info Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p>
                        {personalInfo.firstName} {personalInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Date of Birth:
                      </span>
                      <p>{personalInfo.dateOfBirth}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span>
                      <p>
                        {personalInfo.address}, {personalInfo.city},{" "}
                        {personalInfo.state} {personalInfo.zipCode}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <p>{personalInfo.country}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.type}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span>{doc.name}</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">
                            Uploaded
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    By submitting this verification, you confirm that all
                    information provided is accurate and that you are the person
                    depicted in the uploaded documents. False information may
                    result in account suspension.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back to Documents
                  </Button>
                  <Button
                    onClick={handleSubmitKYC}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
