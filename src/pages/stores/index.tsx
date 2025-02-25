
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Store } from "@/types/database";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StoresPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const { data: stores, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      return data as Store[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('stores').insert({
        name,
        url,
        api_key: apiKey,
        api_secret: apiSecret,
        user_id: '0244961a-6c5f-4f54-89a9-0c0555286e6e' // This should be replaced with the actual user ID from auth
      });

      if (error) throw error;

      toast.success("Store added successfully");
      setIsOpen(false);
      refetch();
      // Reset form
      setName("");
      setUrl("");
      setApiKey("");
      setApiSecret("");
    } catch (error) {
      toast.error("Failed to add store");
      console.error('Error adding store:', error);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
            <p className="text-muted-foreground">
              Manage your WooCommerce stores
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add WooCommerce Store</DialogTitle>
                <DialogDescription>
                  Enter your WooCommerce store details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Store"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Store URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://mystore.com"
                    type="url"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    type="password"
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Store
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableCaption>A list of your WooCommerce stores.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores?.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.url}</TableCell>
                <TableCell>{store.api_key.slice(0, 8)}...</TableCell>
                <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
