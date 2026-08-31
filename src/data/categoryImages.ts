import heavyEquipmentImg from '../assets/images/heavy_equipment_cat_1786980795917.jpg';
import commercialTruckImg from '../assets/images/commercial_truck_scania_1786980813449.jpg';
import bakkieSparesImg from '../assets/images/bakkie_hilux_spares_1786980829564.jpg';
import partsWarehouseImg from '../assets/images/heavy_spares_yard_1786980843620.jpg';
import { CategoryType } from '../types';

export interface CategoryVisualMeta {
  id: CategoryType;
  title: string;
  shortTitle: string;
  subtitle: string;
  image: string;
  alt: string;
  popularMakes: string[];
  sampleParts: string[];
  colorTheme: {
    accent: string;
    border: string;
    badge: string;
  };
}

export const CATEGORY_VISUALS: Record<CategoryType, CategoryVisualMeta> = {
  heavy_equipment: {
    id: 'heavy_equipment',
    title: 'Earthmoving & Heavy Equipment',
    shortTitle: 'Heavy Plant',
    subtitle: 'Excavators, ADTs, Loaders, Dozers',
    image: heavyEquipmentImg,
    alt: 'Caterpillar and Komatsu heavy earthmoving excavator machinery at industrial mining site',
    popularMakes: ['Caterpillar', 'Komatsu', 'Bell Equipment', 'JCB', 'Hitachi', 'Volvo CE'],
    sampleParts: ['Hydraulic Pumps', 'Final Drives', 'Diesel Engines', 'Buckets & Teeth', 'Track Chains'],
    colorTheme: {
      accent: 'text-amber-400',
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    }
  },
  trucks: {
    id: 'trucks',
    title: 'Commercial Trucks & Freight',
    shortTitle: 'Trucks & Trailers',
    subtitle: 'Tractors, Tippers, Rigids, Trailers',
    image: commercialTruckImg,
    alt: 'Heavy-duty commercial freight truck tractor and trailer at transport logistics depot',
    popularMakes: ['Scania', 'Mercedes-Benz', 'Volvo Trucks', 'MAN', 'Isuzu Trucks', 'DAF', 'FAW'],
    sampleParts: ['ZF Gearboxes', 'Differential Assemblies', 'Turbochargers', 'Air Brake Valves', 'Propshafts'],
    colorTheme: {
      accent: 'text-blue-400',
      border: 'border-blue-500/40',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  },
  cars: {
    id: 'cars',
    title: 'Cars, Bakkies & SUVs',
    shortTitle: 'Cars & 4x4 Bakkies',
    subtitle: 'Hilux, Ranger, D-Max, Stripping Spares',
    image: bakkieSparesImg,
    alt: 'Rugged 4x4 double cab bakkie pickup truck on South African route',
    popularMakes: ['Toyota', 'Ford', 'Isuzu', 'Volkswagen', 'Nissan', 'Hyundai', 'BMW'],
    sampleParts: ['D-4D & GD-6 Engines', 'Alternators', 'Body Panels', 'Steering Racks', 'Suspension Arms'],
    colorTheme: {
      accent: 'text-emerald-400',
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }
  },
  minibus_taxis: {
    id: 'minibus_taxis',
    title: 'Minibus / Taxi Spares',
    shortTitle: 'Minibus / Taxi',
    subtitle: 'Quantum, Ses\'fikile, HiAce, NV350, King Long',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80',
    alt: 'South African commuter minibus taxi van parts and spares warehouse',
    popularMakes: ['Toyota Quantum', 'Toyota HiAce', 'Ses\'fikile', 'Nissan NV350 Impendulo', 'King Long', 'Jinbei', 'Mercedes Sprinter', 'Iveco Daily'],
    sampleParts: ['2TR-FE & 2KD Engines', '5-Speed Manual Gearboxes', 'Sliding Doors & Glass', 'Rear Differentials', 'Front Hubs & Brake Discs', 'Steering Columns'],
    colorTheme: {
      accent: 'text-cyan-400',
      border: 'border-cyan-500/40',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    }
  }
};

export const HERO_WAREHOUSE_BANNER_IMAGE = partsWarehouseImg;
