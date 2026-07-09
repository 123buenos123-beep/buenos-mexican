export const menuData = [
  {
    category: "Appetizers and Shareables",
    slug: "appetizers",
    image: "/images/buenos_sampler.webp",
    description: "Perfect for starting your meal or sharing with the table.",
    subcategories: [
      {
        title: "Chips and Dips",
        items: [
          { name: "Chips and Salsa", price: "160", desc: "Our homemade fried tortilla chips served with our signature house salsa or your choice of dips from our salsa selections.", image: "/images/chips_salsa.webp" },
          { name: "Chips and Guacamole", price: "210", desc: "Crispy fried corn tortilla chips with our homemade guacamole.", image: "/images/chips_guacamole_user.webp" },
          { name: "Chips and Queso Dip", price: "195", desc: "", image: "/images/chips_queso.webp" },
          { name: "Buenos Trio", price: "195", desc: "Chips, Queso Dip, Salsa & Guacamole.", image: "/images/buenos_trio.webp" },
          { name: "Buenos Sampler", price: "180", desc: "Chips with a sampler of our homemade salsas.", image: "/images/buenos_sampler.webp" },
        ]
      }
    ]
  },
  {
    category: "Salads",
    slug: "salads",
    image: "/images/shrimp_avocado_salad_new.webp",
    description: "Fresh from the Garden, Packed with Passion – where fresh meets flavor.",
    subcategories: [
      {
        title: "Mexican Chopped Salad",
        description: "A vibrant mix of black beans, cherry tomatoes, bell peppers, romaine lettuce, onions, pico de gallo, and roasted corn, all drizzled with a creamy lime dressing. Served in a crispy flour tortilla bowl for a fresh and flavorful experience.",
        items: [
          { name: "Mexican Chopped Salad — Plain", price: "250", desc: "", image: "/images/mexican_chopped_salad.webp" },
          { name: "Mexican Chopped Salad — Grilled Chicken", price: "275", desc: "", image: "/images/mexican_chopped_salad.webp" },
          { name: "Mexican Chopped Salad — Grilled Steak", price: "290", desc: "", image: "/images/mexican_chopped_salad.webp" },
          { name: "Mexican Chopped Salad — Shrimp", price: "320", desc: "", image: "/images/mexican_chopped_salad.webp" },
        ]
      },
      {
        title: "Caesar Salad",
        description: "A classic Caesar salad with a bold Mexican twist! Crisp romaine lettuce and freshly grated Parmesan cheese tossed in our own Caesar dressing, topped with crunchy corn tortilla bits. Served in a crispy tortilla bowl. Add your choice of protein to make it a hearty, satisfying meal.",
        items: [
          { name: "Caesar Salad — Plain", price: "250", desc: "", image: "/images/caesar_salad.webp" },
          { name: "Caesar Salad — Grilled Chicken", price: "275", desc: "", image: "/images/caesar_salad.webp" },
          { name: "Caesar Salad — Grilled Steak", price: "290", desc: "", image: "/images/caesar_salad.webp" },
          { name: "Caesar Salad — Shrimp", price: "320", desc: "", image: "/images/caesar_salad.webp" },
        ]
      },
      {
        title: "Specialty Salads",
        items: [
          { name: "Shrimp and Avocado Salad", price: "320", desc: "Fresh romaine lettuce tossed with tender shrimp, creamy avocado, cherry tomatoes, red onions, and fresh cilantro. Finished with a hint of heat from jalapeño peppers and topped with crispy tortilla strips. Served in a crunchy tortilla bowl for the perfect bite every time.", image: "/images/shrimp_avocado_salad_new.webp" },
        ]
      }
    ]
  },
  {
    category: "Nachos & Fries",
    slug: "nachos-fries",
    image: "/images/nachos.webp",
    description: "Crispy tortilla chips or fries smothered in warm, gooey melted cheese. Loaded with your choice of meat, jalapeños, tomatoes, and onions.",
    subcategories: [
      {
        title: "Nachos",
        description: "A mountain of crispy tortilla chips smothered in warm, gooey melted cheddar and mozzarella cheeses. Loaded with your choice of meat, then topped with pickled jalapeños, diced tomatoes, and onions. Finished with a drizzle of sour cream and a dollop of our chunky guacamole on top.",
        items: [
          { name: "Cheese Nachos", price: "230", desc: "", image: "/images/nachos.webp" },
          { name: "Chicken Nachos", price: "260", desc: "", image: "/images/nachos.webp" },
          { name: "Carnitas Nachos", price: "260", desc: "", image: "/images/nachos.webp" },
          { name: "Carne Asada Nachos", price: "275", desc: "", image: "/images/nachos.webp" },
          { name: "Al Pastor Nachos", price: "260", desc: "", image: "/images/nachos.webp" },
          { name: "Ground Beef Nachos", price: "250", desc: "", image: "/images/nachos.webp" },
        ]
      },
      {
        title: "Buenos Fiesta Fries",
        description: "Crispy fries piled high with melted cheeses, our signature pico de gallo, your choice of meat, drizzled with sour cream and topped with a dollop of guacamole. Perfect for sharing...because regular fries just won't cut it anymore",
        items: [
          { name: "Cheese Fiesta Fries", price: "230", desc: "", image: "/images/fiesta_fries.webp" },
          { name: "Chicken Fiesta Fries", price: "260", desc: "", image: "/images/fiesta_fries.webp" },
          { name: "Carnitas Fiesta Fries", price: "260", desc: "", image: "/images/fiesta_fries.webp" },
          { name: "Carne Asada Fiesta Fries", price: "275", desc: "", image: "/images/fiesta_fries.webp" },
          { name: "Al Pastor Fiesta Fries", price: "260", desc: "", image: "/images/fiesta_fries.webp" },
          { name: "Ground Beef Fiesta Fries", price: "250", desc: "", image: "/images/fiesta_fries.webp" },
        ]
      }
    ]
  },
  {
    category: "Chef's Specials",
    slug: "chefs-specials",
    image: "/images/brochetas.webp",
    isSpecial: true,
    description: "Signature dishes crafted with care — our chef's pride and joy.",
    subcategories: [
      {
        title: "Sizzling Queso Burrito",
        description: "A bold burrito smothered in sizzling, melted queso straight from the pan.",
        items: [
          { name: "Rice and Beans Queso Burrito", price: "280", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Ground Beef Queso Burrito", price: "280", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Roasted Vegetables Queso Burrito", price: "285", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Chicken Queso Burrito", price: "295", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Carnitas Queso Burrito", price: "295", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Al Pastor Queso Burrito", price: "295", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Birria Queso Burrito", price: "325", desc: "", image: "/images/sizzling_queso_burrito.webp" },
          { name: "Carne Asada Queso Burrito", price: "325", desc: "", image: "/images/sizzling_queso_burrito.webp" },
        ]
      },
      {
        title: "Brochetas",
        description: "Grilled skewers served with Mexican rice, grilled vegetables, and our signature sauces.",
        items: [
          { name: "Chicken Brochetas", price: "260", desc: "", image: "/images/brochetas.webp" },
          { name: "Al Pastor Brochetas", price: "270", desc: "", image: "/images/brochetas.webp" },
          { name: "Carne Asada Brochetas", price: "290", desc: "", image: "/images/brochetas.webp" },
          { name: "Shrimp Brochetas", price: "320", desc: "", image: "/images/brochetas.webp" },
        ]
      }
    ]
  },
  {
    category: "Tacos",
    slug: "tacos",
    image: "/images/tacos.webp",
    isTaco: true,
    description: "The traditional Mexican cuisine favorite around the world! Made with corn tortillas and stuffed with your choice of filling, shredded lettuce, jalapeños, cheese and topped with our own Mexican crema sauce. 2 per order — served with a side of Mexican Rice and Beans.",
    tacoStyles: ["Crunchy", "Gringo (Soft Tortilla)", "Street Style"],
    grandePrice: 100,
    grandeNote: "3 tacos per order — applies to all taco styles, except street tacos",
    items: [
      { name: "Chicken Tacos", price: "230", desc: "", image: "/images/tacos.webp" },
      { name: "Carnitas Tacos", price: "240", desc: "", image: "/images/tacos.webp" },
      { name: "Carne Asada Tacos", price: "250", desc: "", image: "/images/tacos.webp" },
      { name: "Al Pastor Tacos", price: "240", desc: "", image: "/images/tacos.webp" },
      { name: "Ground Beef Tacos", price: "240", desc: "", image: "/images/tacos.webp" },
      { name: "Fish Tacos", price: "250", desc: "", image: "/images/tacos.webp" },
      { name: "Shrimp Tacos", price: "290", desc: "", image: "/images/tacos.webp" },
      { name: "Grilled Vegetables Tacos", price: "220", desc: "", image: "/images/tacos.webp" },
    ],
    subcategories: [
      {
        title: "Specialty Tacos",
        items: [
          { name: "Quesobirria Tacos", price: "250", desc: "Corn tortillas soaked in Birria Consomé, filled with shredded beef and sautéed until crispy, served with salsa, guacamole and topped with Mexican cheese.", image: "/images/quesobirria_tacos.jpg", noTacoOptions: true },
        ]
      }
    ]
  },
  {
    category: "Burritos",
    slug: "burritos",
    image: "/images/burritos_new.jpg",
    description: "Your choice of meats or veggies wrapped in a warm flour tortilla with mexican rice, black beans, melted cheese, and guacamole. Served with a side of sour cream and pico de gallo.",
    notes: [
      { label: "Add a side of Rice and Beans", value: "(+) ฿75" }
    ],
    items: [
      { name: "Rice and Beans Burrito", price: "250", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Chicken Burrito", price: "265", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Carnitas Burrito", price: "275", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Carne Asada Burrito", price: "295", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Al Pastor Burrito", price: "275", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Ground Beef Burrito", price: "250", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Birria Burrito", price: "275", desc: "", image: "/images/burritos_new.jpg" },
      { name: "Roasted Vegetables Burrito", price: "255", desc: "", image: "/images/burritos_new.jpg" },
    ],
    subcategories: [
      {
        title: "Specialty Burrito Styles",
        description: "Any of the above burritos prepared extra special, choose your preference below",
        items: [
          { name: "Wet Burrito", price: "(+) 30", desc: "Any of our burritos smothered in red or green chili sauce and melted mexican cheese and topped with Mexican Crema", image: "/images/wet_burrito.webp", sauceOptions: ["Red Sauce", "Green Sauce"] },
          { name: "Dorado Style", price: "(+) 30", desc: "Any of our burritos, grilled to perfection, served with guacamole and salsa", image: "/images/dorado_style_burrito.webp" },
          { name: "Chimichanga", price: "(+) 30", desc: "Any of our burritos, deep fried, served with guacamole, avocado crema and salsa", image: "/images/chimichanga.webp" },
        ]
      }
    ]
  },
  {
    category: "Quesadillas & Pizzas",
    slug: "quesadillas-pizzas",
    image: "/images/quesadillas_new.webp",
    description: "Cheesy goodness served in tortillas or as our signature Mexican pizzas.",
    subcategories: [
      {
        title: "Quesadillas",
        description: "Large flour tortilla filled with your choice of meat and Mexican cheeses and grilled to perfection. Drizzled with Sour Cream and served with Sour Cream and Guacamole",
        items: [
          { name: "Cheese Quesadilla", price: "220", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Chicken Quesadilla", price: "255", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Carnitas Quesadilla", price: "265", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Carne Asada Quesadilla", price: "275", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Al Pastor Quesadilla", price: "265", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Ground Beef Quesadilla", price: "250", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Shrimp Quesadilla", price: "295", desc: "", image: "/images/quesadillas_new.webp" },
          { name: "Grilled Vegetables Quesadilla", price: "240", desc: "", image: "/images/quesadillas_new.webp" },
        ]
      },
      {
        title: "Mexican Pizzas (8\" / 12\")",
        description: "A double layer of flour tortillas layered with refried beans, mozzarella and cheddar cheese, your choice of meat, pico de gallo, jalapeno peppers, drizzled with sour cream, and topped with a dollop of guacamole",
        items: [
          { name: "Chicken Mexican Pizza", price: "230 / 330", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Carnitas Mexican Pizza", price: "275 / 375", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Carne Asada Mexican Pizza", price: "285 / 385", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Al Pastor Mexican Pizza", price: "260 / 360", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Ground Beef Mexican Pizza", price: "250 / 350", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Shrimp Mexican Pizza", price: "325 / 450", desc: "", image: "/images/mexican_pizza.webp" },
          { name: "Grilled Veggies Mexican Pizza", price: "220 / 320", desc: "", image: "/images/mexican_pizza.webp" },
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
        description: "Start with a base of our Mexican rice, then layer on black beans, your choice of meat or roasted veggies. Top it off with pico de gallo, shredded cheese, and a dollop of guacamole. Drizzle with Mexican crema and served in a crunchy flour tortilla bowl",
        items: [
          { name: "Chicken Burrito Bowl", price: "265", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Carnitas Burrito Bowl", price: "275", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Carne Asada Burrito Bowl", price: "295", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Al Pastor Burrito Bowl", price: "275", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Ground Beef Burrito Bowl", price: "250", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Grilled Vegetables Burrito Bowl", price: "255", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Fish Burrito Bowl", price: "275", desc: "", image: "/images/buenos_bowls.webp" },
          { name: "Shrimp Burrito Bowl", price: "375", desc: "", image: "/images/buenos_bowls.webp" },
        ]
      },
      {
        title: "Fajitas",
        description: "A sizzling Mexican feast, served on a hot cast iron skillet with warm flour tortillas, Mexican rice, refried beans, sour cream and pico de gallo",
        items: [
          { name: "Chicken Fajitas", price: "295", desc: "", image: "/images/fajitas.webp" },
          { name: "Steak Fajitas", price: "325", desc: "", image: "/images/fajitas.webp" },
          { name: "Shrimp Fajitas", price: "375", desc: "", image: "/images/fajitas.webp" },
          { name: "Grilled Vegetables Fajitas", price: "275", desc: "", image: "/images/fajitas.webp" },
        ]
      }
    ]
  },
  {
    category: "Classics",
    slug: "classics",
    image: "/images/flautas_new.webp",
    description: "Traditional Mexican favorites prepared with authentic techniques.",
    subcategories: [
      {
        title: "Flautas (3 Per Order)",
        description: "Golden, flute-shaped flour tortillas stuffed with your choice of meat — fried to a perfect crunch. Served with guacamole and pico de gallo for dipping.",
        items: [
          { name: "Chicken Flautas", price: "240", desc: "", image: "/images/flautas_new.webp" },
          { name: "Carnitas Flautas", price: "240", desc: "", image: "/images/flautas_new.webp" },
          { name: "Ground Beef Flautas", price: "240", desc: "", image: "/images/flautas_new.webp" },
          { name: "Carne Asada Flautas", price: "250", desc: "", image: "/images/flautas_new.webp" },
          { name: "Al Pastor Flautas", price: "250", desc: "", image: "/images/flautas_new.webp" },
          { name: "Shrimp Flautas", price: "325", desc: "", image: "/images/flautas_new.webp" },
        ]
      },
      {
        title: "Taquitos (4 Per Order)",
        description: "Golden rolled corn tortillas deep fried and stuffed with your choice of meat — fried until perfectly crunchy. Served with cool sour cream, and fresh guacamole.",
        items: [
          { name: "Cheese Taquitos", price: "230", desc: "", image: "/images/taquitos_new.webp" },
          { name: "Chicken Taquitos", price: "260", desc: "", image: "/images/taquitos_new.webp" },
          { name: "Carnitas Taquitos", price: "260", desc: "", image: "/images/taquitos_new.webp" },
          { name: "Al Pastor Taquitos", price: "260", desc: "", image: "/images/taquitos_new.webp" },
          { name: "Ground Beef Taquitos", price: "250", desc: "", image: "/images/taquitos_new.webp" },
          { name: "Carne Asada Taquitos", price: "275", desc: "", image: "/images/taquitos_new.webp" },
        ]
      },
      {
        title: "Enchiladas",
        description: "Warm corn tortillas rolled and filled with your choice of meat, or just veggies, smothered in our rich, house-made red or green enchilada sauce. Topped with melted cheese, a drizzle of crema, and fresh cilantro.",
        items: [
          { name: "Vegetable Enchiladas", price: "225", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
          { name: "Chicken Enchiladas", price: "265", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
          { name: "Carnitas Enchiladas", price: "275", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
          { name: "Al Pastor Enchiladas", price: "275", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
          { name: "Carne Asada Enchiladas", price: "275", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
          { name: "Ground Beef Enchiladas", price: "255", desc: "", image: "/images/enchiladas_new.webp", sauceOptions: ["Red Enchilada Sauce", "Green Enchilada Sauce"] },
        ]
      },
      {
        title: "Tostadas",
        description: "Crispy golden tortillas piled high with creamy refried beans, shredded lettuce, and your choice of seasoned meats. Finished with tangy crema, crumbled cheese, onions, and a sprinkle of fresh cilantro. Served with a side of salsa",
        items: [
          { name: "Chicken Tostadas", price: "195", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Carnitas Tostadas", price: "200", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Carne Asada Tostadas", price: "210", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Al Pastor Tostadas", price: "200", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Ground Beef Tostadas", price: "200", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Shrimp Tostadas", price: "250", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Fish Tostadas", price: "210", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
          { name: "Grilled Vegetables Tostadas", price: "190", desc: "", image: "/images/tostadas.webp", notes: [{ label: "Add a side of Rice and Beans", value: "(+) ฿75" }] },
        ]
      }
    ]
  },
  {
    category: "Fusion Selections",
    slug: "fusion",
    image: "/images/tex_mex_ramen_new.jpg",
    description: "Creative blends of Mexican flavors with international favorites.",
    subcategories: [
      {
        title: "Tex-Mex Chili",
        description: "Slow-simmered beef chili with tender kidney beans, fire-roasted tomatoes, and a zesty blend of chili spices. Topped with melted cheddar cheese and a dollop of sour cream, served with a side of Mexican rice and crispy tortilla chips for the ultimate comfort feast.",
        items: [
          { name: "Chili Con Carne", price: "295", desc: "", image: "/images/chili_con_carne.webp" },
        ]
      },
      {
        title: "Tex-Mex Ramen",
        description: "Our Tex-Mex Ramen blends rich, savory Japanese-style broth with vibrant Southwestern flair. Choose your protein: tender birria beef, juicy shredded chicken, or slow-cooked carnitas pork, all nestled in a bed of freshly cooked ramen noodles. Served with zesty pico de gallo, fresh lime wedges, fiery chili flakes, and two cheese-stuffed grilled corn tortillas topped with a smooth drizzle of sour cream. It's comfort food with a spicy, umami-packed twist.",
        items: [
          { name: "Birria Ramen", price: "295", desc: "", image: "/images/tex_mex_ramen_new.jpg" },
          { name: "Shredded Chicken Ramen", price: "275", desc: "", image: "/images/tex_mex_ramen_new.jpg" },
          { name: "Carnitas Pork Ramen", price: "275", desc: "", image: "/images/tex_mex_ramen_new.jpg" },
        ]
      }
    ]
  },
  {
    category: "Dulce / Desserts",
    slug: "desserts",
    image: "/images/churros_new.webp",
    description: "Sweet endings to your Mexican feast.",
    subcategories: [
      {
        title: "Churros",
        description: "Sweet. Crunchy, irresistably delicious!",
        items: [
          { name: "Cinnamon & Sugar Dusted Churros", price: "140", desc: "Made with our own homemade churro batter, deep fried and sprinkled with cinnamon sugar", image: "/images/churros_new.webp" },
          { name: "Churros with Tres Sauces (Chocolate, Mango, Pineapple)", price: "195", desc: "Made with our own homemade churro batter, deep fried and served with 3 sweet sauces", image: "/images/churros_tres_sauces_new.webp" },
          { name: "Churros with Chocolate Dipping Sauce", price: "175", desc: "Made with our own homemade churro batter, deep fried and served with your choice of dipping sauce", image: "/images/churros_chocolate.webp" },
          { name: "Churros with Vanilla Ice Cream", price: "210", desc: "Made with our own homemade churro batter, deep fried and served with vanilla ice cream", image: "/images/churros_ice_cream.webp" },
        ]
      },
      {
        title: "Other Sweets",
        items: [
          { name: "Mexican Spiced Chocolate Cookies & Ice Cream", price: "210", desc: "Homemade, spiced chocolate cookies sandwiching a scoop of vanilla ice cream and rolled in crumbled pecans", image: "/images/spiced_cookies.webp" },
          { name: "Flan", price: "175", desc: "Creamy baked custard with a layer of caramel on top", image: "/images/flan.webp" },
          { name: "Vanilla Ice Cream Bowl", price: "195", desc: "Vanilla ice cream served in a cinnamon sugar dusted flour tortilla bowl", image: "/images/churros_ice_cream.webp" },
        ]
      }
    ]
  }
];
