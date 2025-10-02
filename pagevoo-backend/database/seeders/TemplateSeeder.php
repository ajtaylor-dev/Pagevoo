<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Template;
use App\Models\TemplatePage;
use App\Models\TemplateSection;
use App\Models\User;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user (first admin or create one)
        $admin = User::where('role', 'admin')->first();

        if (!$admin) {
            echo "No admin user found. Please run AdminUserSeeder first.\n";
            return;
        }

        // Restaurant Template
        $this->createRestaurantTemplate($admin->id);

        // Barber Template
        $this->createBarberTemplate($admin->id);

        // Pizza Shop Template
        $this->createPizzaTemplate($admin->id);

        // Cafe Template
        $this->createCafeTemplate($admin->id);

        // Gym Template
        $this->createGymTemplate($admin->id);

        // Salon Template
        $this->createSalonTemplate($admin->id);
    }

    private function createRestaurantTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Classic Restaurant',
            'description' => 'Perfect for fine dining restaurants, bistros, and eateries. Features menu showcase, reservation system, and elegant design.',
            'business_type' => 'restaurant',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        // Home Page
        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero Section',
            'type' => 'hero',
            'content' => [
                'title' => 'Welcome to Our Restaurant',
                'subtitle' => 'Experience culinary excellence',
                'background' => 'restaurant-hero.jpg',
                'cta_text' => 'Book a Table',
                'cta_link' => '/contact'
            ],
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'About Section',
            'type' => 'about',
            'content' => [
                'heading' => 'Our Story',
                'text' => 'We serve the finest cuisine using fresh, locally-sourced ingredients.',
                'image' => 'restaurant-about.jpg'
            ],
            'order' => 1,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Features',
            'type' => 'features',
            'content' => [
                'heading' => 'Why Choose Us',
                'features' => [
                    ['icon' => 'chef', 'title' => 'Expert Chefs', 'text' => 'Award-winning culinary team'],
                    ['icon' => 'organic', 'title' => 'Fresh Ingredients', 'text' => 'Locally sourced produce'],
                    ['icon' => 'service', 'title' => 'Great Service', 'text' => 'Exceptional dining experience']
                ]
            ],
            'order' => 2,
        ]);

        // Menu Page
        $menuPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Menu',
            'slug' => 'menu',
            'is_homepage' => false,
            'order' => 1,
        ]);

        TemplateSection::create([
            'template_page_id' => $menuPage->id,
            'name' => 'Menu Display',
            'type' => 'menu',
            'content' => [
                'heading' => 'Our Menu',
                'categories' => ['Starters', 'Main Course', 'Desserts', 'Beverages']
            ],
            'order' => 0,
        ]);

        // Contact Page
        $contactPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Contact',
            'slug' => 'contact',
            'is_homepage' => false,
            'order' => 2,
        ]);

        TemplateSection::create([
            'template_page_id' => $contactPage->id,
            'name' => 'Contact Form',
            'type' => 'contact',
            'content' => [
                'heading' => 'Reserve Your Table',
                'fields' => ['name', 'email', 'phone', 'date', 'guests', 'message']
            ],
            'order' => 0,
        ]);
    }

    private function createBarberTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Modern Barber Shop',
            'description' => 'Stylish template for barber shops and grooming salons. Includes booking system, service list, and portfolio gallery.',
            'business_type' => 'barber',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero Section',
            'type' => 'hero',
            'content' => [
                'title' => 'Premium Grooming Experience',
                'subtitle' => 'Book your appointment today',
                'background' => 'barber-hero.jpg',
                'cta_text' => 'Book Now',
                'cta_link' => '/booking'
            ],
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Services',
            'type' => 'services',
            'content' => [
                'heading' => 'Our Services',
                'services' => [
                    ['name' => 'Haircut', 'price' => '£25', 'duration' => '30 min'],
                    ['name' => 'Beard Trim', 'price' => '£15', 'duration' => '15 min'],
                    ['name' => 'Hot Towel Shave', 'price' => '£30', 'duration' => '45 min']
                ]
            ],
            'order' => 1,
        ]);

        $servicesPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Services',
            'slug' => 'services',
            'order' => 1,
        ]);

        $bookingPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Book Appointment',
            'slug' => 'booking',
            'order' => 2,
        ]);
    }

    private function createPizzaTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Pizza Parlor',
            'description' => 'Perfect for pizza shops and takeaway restaurants. Features online ordering, menu display, and delivery options.',
            'business_type' => 'pizza',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero Section',
            'type' => 'hero',
            'content' => [
                'title' => 'Authentic Italian Pizza',
                'subtitle' => 'Order online for delivery or collection',
                'cta_text' => 'Order Now',
                'cta_link' => '/menu'
            ],
            'order' => 0,
        ]);

        $menuPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Menu & Order',
            'slug' => 'menu',
            'order' => 1,
        ]);
    }

    private function createCafeTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Cozy Cafe',
            'description' => 'Warm and inviting design for cafes and coffee shops. Includes menu, gallery, and contact information.',
            'business_type' => 'cafe',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero',
            'type' => 'hero',
            'content' => [
                'title' => 'Your Daily Dose of Coffee',
                'subtitle' => 'Freshly brewed, locally roasted',
                'cta_text' => 'View Menu',
            ],
            'order' => 0,
        ]);
    }

    private function createGymTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Fitness Gym',
            'description' => 'Dynamic template for gyms and fitness centers. Features class schedule, membership plans, and trainer profiles.',
            'business_type' => 'gym',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero',
            'type' => 'hero',
            'content' => [
                'title' => 'Transform Your Body',
                'subtitle' => 'Join our fitness community today',
                'cta_text' => 'Get Started',
            ],
            'order' => 0,
        ]);

        $classesPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Classes',
            'slug' => 'classes',
            'order' => 1,
        ]);
    }

    private function createSalonTemplate($adminId)
    {
        $template = Template::create([
            'name' => 'Beauty Salon',
            'description' => 'Elegant design for beauty salons and spas. Includes service menu, booking system, and before/after gallery.',
            'business_type' => 'salon',
            'is_active' => true,
            'created_by' => $adminId,
        ]);

        $homePage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'home',
            'is_homepage' => true,
            'order' => 0,
        ]);

        TemplateSection::create([
            'template_page_id' => $homePage->id,
            'name' => 'Hero',
            'type' => 'hero',
            'content' => [
                'title' => 'Beauty & Wellness',
                'subtitle' => 'Professional salon services',
                'cta_text' => 'Book Appointment',
            ],
            'order' => 0,
        ]);

        $servicesPage = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Services',
            'slug' => 'services',
            'order' => 1,
        ]);
    }
}
