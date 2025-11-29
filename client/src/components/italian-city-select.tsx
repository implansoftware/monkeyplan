import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ITALIAN_CITIES = [
  "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti",
  "Avellino", "Bari", "Barletta-Andria-Trani", "Belluno", "Benevento", "Bergamo",
  "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi", "Cagliari", "Caltanissetta",
  "Campobasso", "Carbonia-Iglesias", "Caserta", "Catania", "Catanzaro", "Chieti",
  "Como", "Cosenza", "Cremona", "Crotone", "Cuneo", "Enna", "Fermo", "Ferrara",
  "Firenze", "Foggia", "Forlì-Cesena", "Frosinone", "Genova", "Gorizia", "Grosseto",
  "Imperia", "Isernia", "La Spezia", "L'Aquila", "Latina", "Lecce", "Lecco",
  "Livorno", "Lodi", "Lucca", "Macerata", "Mantova", "Massa-Carrara", "Matera",
  "Medio Campidano", "Messina", "Milano", "Modena", "Monza e Brianza", "Napoli",
  "Novara", "Nuoro", "Ogliastra", "Olbia-Tempio", "Oristano", "Padova", "Palermo",
  "Parma", "Pavia", "Perugia", "Pesaro e Urbino", "Pescara", "Piacenza", "Pisa",
  "Pistoia", "Pordenone", "Potenza", "Prato", "Ragusa", "Ravenna", "Reggio Calabria",
  "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo", "Salerno", "Sassari",
  "Savona", "Siena", "Siracusa", "Sondrio", "Taranto", "Teramo", "Terni", "Torino",
  "Trapani", "Trento", "Treviso", "Trieste", "Udine", "Varese", "Venezia",
  "Verbano-Cusio-Ossola", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo"
];

interface ItalianCitySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  "data-testid"?: string;
}

export function ItalianCitySelect({
  value,
  onChange,
  placeholder = "Seleziona città...",
  className,
  id,
  "data-testid": testId = "select-city",
}: ItalianCitySelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const filteredCities = useMemo(() => {
    if (!inputValue) return ITALIAN_CITIES;
    const search = inputValue.toLowerCase();
    return ITALIAN_CITIES.filter((city) =>
      city.toLowerCase().includes(search)
    );
  }, [inputValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          id={id}
          data-testid={testId}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cerca città..."
            value={inputValue}
            onValueChange={setInputValue}
            data-testid={`${testId}-input`}
          />
          <CommandList>
            <CommandEmpty>Nessuna città trovata.</CommandEmpty>
            <CommandGroup>
              {filteredCities.slice(0, 20).map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => {
                    onChange(city);
                    setOpen(false);
                    setInputValue("");
                  }}
                  data-testid={`${testId}-option-${city.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ITALIAN_CITIES };
