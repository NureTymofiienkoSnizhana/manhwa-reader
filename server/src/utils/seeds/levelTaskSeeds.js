module.exports = [
    {
      level: 1,
      description: {
        en: "Welcome to the Manhwa Reader! Complete your first manhwa to advance.",
        ua: "Ласкаво просимо до Manhwa Reader! Завершіть свою першу манхву, щоб просунутися."
      },
      requirements: [
        {
          type: "read_manhwa",
          count: 1
        }
      ],
      reward: 100
    },
    {
      level: 2,
      description: {
        en: "You're getting started! Read 3 manhwas and write at least one review.",
        ua: "Ви тільки починаєте! Прочитайте 3 манхви та напишіть хоча б один відгук."
      },
      requirements: [
        {
          type: "read_manhwa",
          count: 3
        },
        {
          type: "write_review",
          count: 1
        }
      ],
      reward: 200
    },
    {
      level: 3,
      description: {
        en: "Create a category and add 5 manhwas to your collection.",
        ua: "Створіть категорію та додайте 5 манхв до своєї колекції."
      },
      requirements: [
        {
          type: "create_category",
          count: 1
        },
        {
          type: "add_to_category",
          count: 5
        }
      ],
      reward: 300
    },
    {
      level: 4,
      description: {
        en: "Become a critic! Rate at least 10 manhwas and write 5 reviews.",
        ua: "Станьте критиком! Оцініть щонайменше 10 манхв та напишіть 5 відгуків."
      },
      requirements: [
        {
          type: "rate_manhwa",
          count: 10
        },
        {
          type: "write_review",
          count: 5
        }
      ],
      reward: 400
    },
    {
      level: 5,
      description: {
        en: "Collector's pride! Create 3 different categories and read 20 manhwas.",
        ua: "Гордість колекціонера! Створіть 3 різні категорії та прочитайте 20 манхв."
      },
      requirements: [
        {
          type: "create_category",
          count: 3
        },
        {
          type: "read_manhwa",
          count: 20
        }
      ],
      reward: 500
    }
  ];