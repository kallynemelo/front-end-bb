import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDeleteDialogProps = {
  /** Elemento que abre o pop-up ao ser clicado (ex.: o botão da lixeira). */
  children: ReactNode;
  /** Executado somente quando o usuário clica em "Sim". */
  onConfirm: () => void;
  title?: string;
  description?: ReactNode;
};

/** Pop-up padrão de confirmação para qualquer ação de apagar. */
export function ConfirmDeleteDialog({
  children,
  onConfirm,
  title = "Deseja deletar?",
  description = "Essa ação não poderá ser desfeita.",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>Não</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            Sim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
