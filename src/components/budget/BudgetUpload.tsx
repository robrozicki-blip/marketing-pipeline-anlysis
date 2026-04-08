import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BudgetData, MonthlySpend } from "@/lib/budgetCalculations";
import { useState } from "react";

interface BudgetUploadProps {
  onDataUploaded: (data: Partial<BudgetData>) => void;
}

export function BudgetUpload({ onDataUploaded }: BudgetUploadProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState("");

  const downloadTemplate = () => {
    const templateCSV = `Category,Jan 2026,Feb 2026,Mar 2026,Apr 2026,May 2026,Jun 2026,Jul 2026,Aug 2026,Sep 2026,Oct 2026,Nov 2026,Dec 2026
Demand Gen,0,0,0,0,0,0,0,0,0,0,0,0
Content,0,0,0,0,0,0,0,0,0,0,0,0
Field,0,0,0,0,0,0,0,0,0,0,0,0
Brand,0,0,0,0,0,0,0,0,0,0,0,0
Ecosystem,0,0,0,0,0,0,0,0,0,0,0,0
MarTech,0,0,0,0,0,0,0,0,0,0,0,0
Headcount,0,0,0,0,0,0,0,0,0,0,0,0`;

    const blob = new Blob([templateCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monthly-budget-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({
      title: "Template Downloaded",
      description: "Monthly budget template downloaded successfully.",
    });
  };

  const parseCSVData = (text: string): MonthlySpend[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check if first column is "Category" or "Month" to determine format
    const isTransposed = headers[0].toLowerCase() === 'category';
    
    if (isTransposed) {
      // New format: Categories as rows, months as columns
      const months = headers.slice(1); // Get all month columns
      const monthlySpend: MonthlySpend[] = [];
      
      // Initialize data structure for each month
      const monthData: { [key: string]: Partial<MonthlySpend> } = {};
      months.forEach(month => {
        monthData[month] = { month };
      });
      
      // Parse each category row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const category = values[0]?.toLowerCase();
        if (!category) continue;
        
        // Assign values to each month for this category
        for (let j = 1; j < values.length && j <= months.length; j++) {
          const monthKey = months[j - 1];
          const value = parseFloat(values[j] || '0') || 0;
          
          if (category.includes('demand') || category.includes('demandgen')) {
            monthData[monthKey].demandGen = value;
          } else if (category.includes('content')) {
            monthData[monthKey].content = value;
          } else if (category.includes('field')) {
            monthData[monthKey].field = value;
          } else if (category.includes('brand')) {
            monthData[monthKey].brand = value;
          } else if (category.includes('ecosystem')) {
            monthData[monthKey].ecosystem = value;
          } else if (category.includes('martech') || category.includes('mar tech')) {
            monthData[monthKey].martech = value;
          } else if (category.includes('headcount')) {
            monthData[monthKey].headcount = value;
          }
        }
      }
      
      // Convert to array format
      Object.entries(monthData).forEach(([month, data]) => {
        monthlySpend.push({
          month,
          demandGen: data.demandGen || 0,
          content: data.content || 0,
          field: data.field || 0,
          brand: data.brand || 0,
          ecosystem: data.ecosystem || 0,
          martech: data.martech || 0,
          headcount: data.headcount || 0,
        });
      });
      
      return monthlySpend;
    } else {
      // Old format: Months as rows, categories as columns
      const headersLower = headers.map(h => h.toLowerCase());
      const monthlySpend: MonthlySpend[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;
        
        const month = values[0]?.trim();
        if (!month) continue;
        
        const spend: MonthlySpend = {
          month,
          demandGen: parseFloat(values[headersLower.indexOf('demand gen')] || values[headersLower.indexOf('demandgen')] || '0') || 0,
          content: parseFloat(values[headersLower.indexOf('content')] || '0') || 0,
          field: parseFloat(values[headersLower.indexOf('field')] || '0') || 0,
          brand: parseFloat(values[headersLower.indexOf('brand')] || '0') || 0,
          ecosystem: parseFloat(values[headersLower.indexOf('ecosystem')] || '0') || 0,
          martech: parseFloat(values[headersLower.indexOf('martech')] || values[headersLower.indexOf('mar tech')] || '0') || 0,
          headcount: parseFloat(values[headersLower.indexOf('headcount')] || '0') || 0,
        };
        
        monthlySpend.push(spend);
      }
      
      return monthlySpend;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const text = await file.text();
      const monthlySpend = parseCSVData(text);

      if (monthlySpend.length > 0) {
        onDataUploaded({ monthlySpend });
        toast({
          title: "Upload Successful",
          description: `Imported ${monthlySpend.length} months of budget data.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "Could not find valid monthly data in the CSV file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error parsing CSV:', error);
      }
      toast({
        title: "Upload Failed",
        description: "Failed to parse the CSV file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!sheetsUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a Google Sheets URL.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let csvUrl = sheetsUrl;
      
      // Convert Google Sheets URL to CSV export URL
      if (sheetsUrl.includes('docs.google.com/spreadsheets')) {
        const sheetId = sheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        const gidMatch = sheetsUrl.match(/[#&]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        
        if (sheetId) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        }
      }

      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch Google Sheets data');
      
      const text = await response.text();
      const monthlySpend = parseCSVData(text);

      if (monthlySpend.length > 0) {
        onDataUploaded({ monthlySpend });
        toast({
          title: "Import Successful",
          description: `Imported ${monthlySpend.length} months of budget data from Google Sheets.`,
        });
        setSheetsUrl("");
      } else {
        toast({
          title: "No Data Found",
          description: "Could not find valid monthly data in the sheet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error importing from Google Sheets:', error);
      }
      toast({
        title: "Import Failed",
        description: "The sheet must be shared as 'Anyone with the link can view'. Click Share in Google Sheets and change the setting.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Budget Data</CardTitle>
            <CardDescription>
              Import monthly spend data from CSV or Google Sheets
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sheets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
            <TabsTrigger value="csv">CSV File</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sheets" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sheets-url">Google Sheets URL</Label>
              <div className="flex gap-2">
                <Input
                  id="sheets-url"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  disabled={isProcessing}
                />
                <Button 
                  disabled={isProcessing || !sheetsUrl}
                  onClick={handleGoogleSheetsImport}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Share your sheet:</strong> Click "Share" → Change to "Anyone with the link" → Set as "Viewer"</li>
                <li>Copy the sheet URL from your browser address bar</li>
                <li>Paste it above and click Import</li>
              </ol>
              <p className="text-xs mt-2 p-2 bg-muted rounded">
                ⚠️ Important: The sheet must be set to "Anyone with the link can view" or the import will fail.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">CSV File</Label>
              <div className="flex gap-2">
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="cursor-pointer"
                />
                <Button 
                  disabled={isProcessing}
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Upload'}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Expected CSV format:</p>
              <code className="block bg-muted p-2 rounded text-xs overflow-x-auto">
                Category,Jan 2026,Feb 2026,Mar 2026,...<br/>
                Demand Gen,45000,24000,31000,...<br/>
                Content,20000,18000,22000,...<br/>
                Headcount,0,0,0,... (optional)
              </code>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
