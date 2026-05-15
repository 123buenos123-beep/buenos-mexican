export const menuData = [
  {
    category: "Tacos",
    slug: "tacos",
    image: "/images/tacos_hero.png",
    description: "Authentic street-style tacos served on warm corn tortillas with onions and cilantro.",
    items: [
      { name: "Al Pastor Tacos", price: "220", desc: "Marinated pork with pineapple, onions, and cilantro.", image: "/images/tacos_hero.png" },
      { name: "Carne Asada Tacos", price: "240", desc: "Grilled steak with onions and cilantro.", image: "/images/tacos_hero.png" },
      { name: "Pollo (Chicken) Tacos", price: "210", desc: "Seasoned grilled chicken with onions and cilantro.", image: "/images/tacos_hero.png" },
      { name: "Shrimp Tacos", price: "275", desc: "Grilled shrimp with cabbage slaw and chipotle mayo.", image: "/images/tacos_hero.png" },
      { name: "Fish Tacos", price: "265", desc: "Beer-battered fish with cabbage and lime crema.", image: "/images/tacos_hero.png" },
    ]
  },
  {
    category: "Burritos",
    slug: "burritos",
    image: "/images/burritos.webp",
    description: "Your choice of meats or veggies wrapped in a warm flour tortilla with mexican rice, black beans, melted cheese, and guacamole.",
    items: [
      { name: "Rice and Beans Burrito", price: "250", desc: "", image: "/images/burritos.webp" },
      { name: "Chicken, Carnitas, Al Pastor, Birria", price: "265-275", desc: "", image: "/images/burritos.webp" },
      { name: "Carnie Asada", price: "295", desc: "", image: "/images/burritos.webp" },
      { name: "Ground Beef", price: "250", desc: "", image: "/images/burritos.webp" },
      { name: "Roasted Vegetables", price: "255", desc: "", image: "/images/burritos.webp" },
    ],
    subcategories: [
      {
        title: "Specialty Burrito Styles",
        items: [
          { name: "Wet Burrito, Dorado Style, Chimichanga", price: "(+) 30", desc: "Make any burrito special.", image: "/images/burritos.webp" }
        ]
      }
    ]
  },
  {
    category: "Appetizers and Shareables",
    slug: "appetizers",
    image: "/images/chips_dips.webp",
    description: "Perfect for starting your meal or sharing with the table.",
    subcategories: [
      {
        title: "Chips and Dips",
        items: [
          { name: "Chips and Salsa", price: "160", desc: "Our Homemade fried tortilla chips served with our signature house salsa or your choice of dips from our salsa selections", image: "/images/chips_dips.webp" },
          { name: "Chips and Guacamole", price: "210", desc: "Crispy fried corn tortilla chips with our homemade guacamole", image: "/images/chips_dips.webp" },
          { name: "Chips and Queso Dip", price: "195", desc: "", image: "/images/chips_dips.webp" },
          { name: "Buenos Trio", price: "195", desc: "Chips, Queso Dip, Salsa & Guacamole", image: "/images/chips_dips.webp" },
          { name: "Buenos Sampler", price: "180", desc: "Chips with a sampler (of our homemade salsas)", image: "/images/chips_dips.webp" },
        ]
      }
    ]
  },
  {
    category: "Salads",
    slug: "salads",
    image: "/images/salads.webp",
    description: "Fresh from the Garden, Packed with Passion – where fresh meets flavor",
    items: [
      { name: "Mexican Chopped Salad", price: "250-320", desc: "A vibrant mix of black beans, cherry tomatoes, bell peppers, romaine lettuce, onions, pico de gallo, and roasted corn. Served in a crispy flour tortilla bowl.\nPlain: 250 | Grilled Chicken: 275 | Grilled Steak: 290 | Shrimp: 320", image: "/images/salads.webp" },
      { name: "Caesar Salad", price: "250-320", desc: "A classic Caesar salad with a bold Mexican twist! Served in a crispy tortilla bowl.\nPlain: 250 | Grilled Chicken: 275 | Grilled Steak: 290 | Shrimp: 320", image: "/images/salads.webp" },
      { name: "Shrimp and Avocado Salad", price: "320", desc: "Fresh romaine lettuce tossed with tender shrimp, creamy avocado, cherry tomatoes, and red onions. Topped with crispy tortilla strips.", image: "/images/salads.webp" },
    ]
  },
  {
    category: "Nachos & Fries",
    slug: "nachos-fries",
    image: "/images/nachos.webp",
    description: "Crispy tortilla chips or fries smothered in warm, gooey melted cheeses. Loaded with your choice of meat, jalapeños, tomatoes, and onions.",
    items: [
      { name: "Nachos (Various Meats)", price: "230-275", desc: "Cheese, Chicken, Carnitas, Carnie Asada, Al Pastor, Ground Beef.", image: "/images/nachos.webp" },
      { name: "Buenos Fiesta Fries", price: "230-275", desc: "Cheese, Chicken, Carnitas, Carnie Asada, Al Pastor, Ground Beef.", image: "/images/nachos.webp" }
    ]
  },
  {
    category: "Classics",
    slug: "classics",
    image: "/images/flautas.webp",
    description: "Traditional Mexican favorites prepared with authentic techniques.",
    subcategories: [
      {
        title: "Flautas (3 Per Order)",
        items: [
          { name: "Chicken, Carnitas, Ground Beef", price: "240", desc: "", image: "/images/flautas.webp" },
          { name: "Carnie Asada, Al Pastor", price: "250", desc: "", image: "/images/flautas.webp" },
          { name: "Shrimp Flautas", price: "325", desc: "", image: "/images/flautas.webp" },
        ]
      },
      {
        title: "Taquitos (4 Per Order)",
        items: [
          { name: "Cheese Taquitos", price: "230", desc: "", image: "/images/flautas.webp" },
          { name: "Chicken, Carnitas, Al Pastor", price: "260", desc: "", image: "/images/flautas.webp" },
          { name: "Carnie Asada", price: "275", desc: "", image: "/images/flautas.webp" },
          { name: "Ground Beef", price: "250", desc: "", image: "/images/flautas.webp" },
        ]
      },
      {
        title: "Enchiladas",
        items: [
          { name: "Vegetable", price: "225", desc: "", image: "/images/flautas.webp" },
          { name: "Chicken, Carnitas", price: "265", desc: "", image: "/images/flautas.webp" },
          { name: "Al Pastor, Carne Asada", price: "275", desc: "", image: "/images/flautas.webp" },
          { name: "Ground Beef", price: "255", desc: "", image: "/images/flautas.webp" },
        ]
      }
    ]
  },
  {
    category: "Bowls & Fajitas",
    slug: "bowls-fajitas",
    image: "/images/fajitas.webp",
    description: "Hearty bowls and sizzling fajitas served with all the fixings.",
    subcategories: [
      {
        title: "Buenos Burrito Bowls",
        items: [
          { name: "Chicken, Carnitas, Al Pastor, Ground Beef", price: "250-275", desc: "", image: "/images/fajitas.webp" },
          { name: "Carnie Asada", price: "295", desc: "", image: "/images/fajitas.webp" },
          { name: "Fish / Shrimp", price: "275 / 375", desc: "", image: "/images/fajitas.webp" },
        ]
      },
      {
        title: "Fajitas",
        items: [
          { name: "Chicken / Steak", price: "295 / 325", desc: "", image: "/images/fajitas.webp" },
          { name: "Shrimp / Vegetables", price: "375 / 275", desc: "", image: "/images/fajitas.webp" },
        ]
      }
    ]
  },
  {
    category: "Quesadillas & Pizzas",
    slug: "quesadillas-pizzas",
    image: "/images/quesadillas.webp",
    description: "Cheesy goodness served in tortillas or as our signature Mexican pizzas.",
    subcategories: [
      {
        title: "Quesadillas",
        items: [
          { name: "Cheese, Chicken, Carnitas", price: "220-265", desc: "", image: "/images/quesadillas.webp" },
          { name: "Carnie Asada, Al Pastor, Ground Beef", price: "250-275", desc: "", image: "/images/quesadillas.webp" },
          { name: "Shrimp, Grilled Vegetables", price: "295 / 240", desc: "", image: "/images/quesadillas.webp" },
        ]
      },
      {
        title: "Mexican Pizzas (8\" / 12\")",
        items: [
          { name: "Chicken, Carnitas, Al Pastor", price: "230-375", desc: "", image: "/images/quesadillas.webp" },
          { name: "Carnie Asada, Ground Beef", price: "250-385", desc: "", image: "/images/quesadillas.webp" },
          { name: "Shrimp, Grilled Veggies", price: "220-450", desc: "", image: "/images/quesadillas.webp" },
        ]
      }
    ]
  },
  {
    category: "Fusion Selections",
    slug: "fusion",
    image: "/images/fusion_ramen.webp",
    description: "Creative blends of Mexican flavors with international favorites.",
    items: [
      { name: "Chili Con Carne (Tex-Mex Chili)", price: "295", desc: "Slow-simmered beef chili with tender kidney beans, fire-roasted tomatoes.", image: "/images/fusion_ramen.webp" },
      { name: "Birria Ramen", price: "295", desc: "Tex-Mex Ramen blending rich, savory Japanese-style broth.", image: "/images/fusion_ramen.webp" },
      { name: "Shredded Chicken / Carnitas Ramen", price: "275", desc: "Tex-Mex Ramen.", image: "/images/fusion_ramen.webp" },
    ]
  },
  {
    category: "Buenos Platillos",
    slug: "platillos",
    image: "/images/platillos.webp",
    description: "Hearty, traditional Mexican plates served with Mexican rice, choice of beans, and warm corn or flour tortillas.",
    items: [
      { name: "Traditional Carnitas Plate", price: "325", desc: "Slow-roasted, tender pork served with pico de gallo, guacamole, and lime.", image: "/images/platillos.webp" },
      { name: "Carne Asada Plate", price: "345", desc: "Grilled marinated steak served with grilled scallions and a roasted jalapeño.", image: "/images/platillos.webp" },
      { name: "Chile Relleno", price: "295", desc: "A large poblano pepper stuffed with cheese, battered and fried, topped with ranchero sauce.", image: "/images/platillos.webp" },
      { name: "Tacos Dorado (3)", price: "275", desc: "Crispy hard-shell tacos with your choice of meat, lettuce, cheese, and tomatoes.", image: "/images/platillos.webp" },
    ]
  },
  {
    category: "Drinks",
    slug: "drinks",
    image: "/images/margarita_hero.png",
    description: "Refreshing Mexican beverages and signature cocktails.",
    subcategories: [
      {
        title: "Margaritas",
        items: [
          { name: "House Margarita", price: "185", desc: "Classic lime margarita with 100% agave tequila.", image: "/images/margarita_hero.png" },
        ]
      },
      {
        title: "Non-Alcoholic",
        items: [
          { name: "Horchata", price: "85", desc: "Sweet rice milk with cinnamon and vanilla.", image: "/images/margarita_hero.png" },
          { name: "Jamaica (Hibiscus)", price: "75", desc: "Tart and refreshing hibiscus flower tea.", image: "/images/margarita_hero.png" },
          { name: "Mexican Coke", price: "65", desc: "The classic, sweetened with cane sugar.", image: "/images/margarita_hero.png" },
        ]
      }
    ]
  },
  {
    category: "Dulce / Desserts",
    slug: "desserts",
    image: "/images/churros.webp",
    description: "Sweet endings to your Mexican feast.",
    subcategories: [
      {
        title: "Churros",
        items: [
          { name: "Cinnamon & Sugar / Tres Sauces", price: "140 / 195", desc: "", image: "/images/churros.webp" },
          { name: "With Chocolate / Vanilla Ice Cream", price: "175 / 210", desc: "", image: "/images/churros.webp" },
        ]
      },
      {
        title: "Other Sweets",
        items: [
          { name: "Mexican Spiced Chocolate Cookies", price: "210", desc: "", image: "/images/churros.webp" },
          { name: "Caramel and Cinnamon Pastry / Flan", price: "210 / 175", desc: "", image: "/images/churros.webp" },
        ]
      }
    ]
  }
];
