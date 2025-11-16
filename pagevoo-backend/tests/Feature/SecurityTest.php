<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\Security\CssSanitizer;
use App\Services\Security\HtmlSanitizer;
use App\Services\Security\PathValidator;
use App\Exceptions\SecurityException;
use App\Models\User;
use App\Models\UserWebsite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected CssSanitizer $cssSanitizer;
    protected HtmlSanitizer $htmlSanitizer;
    protected PathValidator $pathValidator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cssSanitizer = new CssSanitizer();
        $this->htmlSanitizer = new HtmlSanitizer();
        $this->pathValidator = new PathValidator();
    }

    /**
     * Test CSS injection prevention
     */
    public function test_css_sanitizer_blocks_javascript_protocols()
    {
        $maliciousCss = [
            "background: url('javascript:alert(1)');" => "background: none;",
            "background-image: url('vbscript:msgbox(1)');" => "background-image: none;",
            "background: url('data:text/html,<script>alert(1)</script>');" => "background: none;",
            "@import url('javascript:alert(1)');" => "",
            "content: 'javascript:alert(1)';" => "content: '';",
        ];

        foreach ($maliciousCss as $input => $expected) {
            $result = $this->cssSanitizer->sanitize($input);
            $this->assertStringNotContainsString('javascript:', $result);
            $this->assertStringNotContainsString('vbscript:', $result);
            $this->assertStringNotContainsString('<script>', $result);
        }
    }

    /**
     * Test CSS expression blocking
     */
    public function test_css_sanitizer_blocks_expressions()
    {
        $maliciousCss = [
            "width: expression(alert('XSS'));" => "width: none;",
            "background-image: expression(document.cookie);" => "background-image: none;",
            "-moz-binding: url('http://evil.com/xss.xml');" => "",
            "behavior: url('http://evil.com/xss.htc');" => "",
        ];

        foreach ($maliciousCss as $input => $expected) {
            $result = $this->cssSanitizer->sanitize($input);
            $this->assertStringNotContainsString('expression', $result);
            $this->assertStringNotContainsString('-moz-binding', $result);
            $this->assertStringNotContainsString('behavior:', $result);
        }
    }

    /**
     * Test XSS prevention in HTML
     */
    public function test_html_sanitizer_blocks_scripts()
    {
        $maliciousHtml = [
            "<script>alert('XSS')</script>" => "",
            "<img src='x' onerror='alert(1)'>" => "<img src=\"x\">",
            "<a href='javascript:alert(1)'>Click</a>" => "<a>Click</a>",
            "<div onmouseover='alert(1)'>Hover</div>" => "<div>Hover</div>",
            "<iframe src='evil.com'></iframe>" => "",
            "<object data='evil.com'></object>" => "",
            "<embed src='evil.swf'>" => "",
        ];

        foreach ($maliciousHtml as $input => $expected) {
            $result = $this->htmlSanitizer->sanitize($input);
            $this->assertStringNotContainsString('<script', $result);
            $this->assertStringNotContainsString('javascript:', $result);
            $this->assertStringNotContainsString('onerror', $result);
            $this->assertStringNotContainsString('onmouseover', $result);
            $this->assertStringNotContainsString('<iframe', $result);
            $this->assertStringNotContainsString('<object', $result);
            $this->assertStringNotContainsString('<embed', $result);
        }
    }

    /**
     * Test event handler removal
     */
    public function test_html_sanitizer_removes_event_handlers()
    {
        $html = '<div onclick="alert(1)" onmouseover="alert(2)" onload="alert(3)">Content</div>';
        $result = $this->htmlSanitizer->sanitize($html);

        $this->assertStringNotContainsString('onclick', $result);
        $this->assertStringNotContainsString('onmouseover', $result);
        $this->assertStringNotContainsString('onload', $result);
        $this->assertStringContainsString('Content', $result);
    }

    /**
     * Test path traversal prevention
     */
    public function test_path_validator_blocks_directory_traversal()
    {
        $baseDir = '/var/www/html';
        $maliciousPaths = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32',
            '../../private_files/secrets.txt',
            'files/../../../etc/passwd',
            'files/..\\..\\..\\etc\\passwd',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            '....//....//....//etc/passwd',
            'files/../../\x00/etc/passwd',
        ];

        foreach ($maliciousPaths as $path) {
            try {
                $this->pathValidator->validatePath($path, $baseDir);
                $this->fail("Path traversal not blocked: $path");
            } catch (SecurityException $e) {
                $this->assertTrue(true); // Expected exception
            }
        }
    }

    /**
     * Test null byte injection prevention
     */
    public function test_path_validator_blocks_null_bytes()
    {
        $baseDir = '/var/www/html';
        $maliciousPaths = [
            "file.php\x00.jpg",
            "file.php%00.jpg",
            "file\x00.txt",
        ];

        foreach ($maliciousPaths as $path) {
            try {
                $this->pathValidator->validatePath($path, $baseDir);
                $this->fail("Null byte not blocked: $path");
            } catch (SecurityException $e) {
                $this->assertTrue(true); // Expected exception
            }
        }
    }

    /**
     * Test double extension detection
     */
    public function test_path_validator_detects_double_extensions()
    {
        $maliciousFilenames = [
            'shell.php.jpg',
            'backdoor.asp.png',
            'exploit.jsp.gif',
            'malware.php.jpeg',
        ];

        foreach ($maliciousFilenames as $filename) {
            $result = $this->pathValidator->hasDoubleExtension($filename);
            $this->assertTrue($result, "Double extension not detected: $filename");
        }

        // Test legitimate files
        $legitimateFilenames = [
            'image.jpg',
            'document.pdf',
            'script.js',
            'style.css',
        ];

        foreach ($legitimateFilenames as $filename) {
            $result = $this->pathValidator->hasDoubleExtension($filename);
            $this->assertFalse($result, "False positive for: $filename");
        }
    }

    /**
     * Test safe filename generation
     */
    public function test_path_validator_generates_safe_filenames()
    {
        $unsafeFilenames = [
            '../../../etc/passwd' => 'etcpasswd',
            'file name with spaces.txt' => 'file_name_with_spaces.txt',
            'file@#$%^&*.txt' => 'file.txt',
            '../../secret.php' => 'secret.php',
            'file\x00.txt' => 'file.txt',
        ];

        foreach ($unsafeFilenames as $input => $expected) {
            $result = $this->pathValidator->generateSafeFilename($input);
            $this->assertStringNotContainsString('..', $result);
            $this->assertStringNotContainsString('/', $result);
            $this->assertStringNotContainsString('\\', $result);
            $this->assertMatchesRegularExpression('/^[a-zA-Z0-9_\-\.]+$/', $result);
        }
    }

    /**
     * Test input validation on save website endpoint
     */
    public function test_save_website_validates_input()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Test with malicious input
        $response = $this->postJson('/api/v1/websites', [
            'name' => '<script>alert(1)</script>',
            'site_css' => 'background: url("javascript:alert(1)");',
            'pages' => [
                [
                    'name' => 'Home',
                    'slug' => '../../../etc/passwd',
                    'order' => 0,
                    'sections' => [
                        [
                            'type' => 'malicious_type',
                            'order' => 0,
                            'content' => [
                                'title' => '<script>XSS</script>',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(422); // Validation error
        $errors = $response->json('errors');

        $this->assertArrayHasKey('name', $errors);
        $this->assertArrayHasKey('pages.0.slug', $errors);
        $this->assertArrayHasKey('pages.0.sections.0.type', $errors);
    }

    /**
     * Test CSS size limits
     */
    public function test_css_size_limits_enforced()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Generate CSS larger than 500KB limit
        $largeCss = str_repeat('body { color: red; }', 30000); // > 500KB

        $response = $this->postJson('/api/v1/websites', [
            'name' => 'Test Website',
            'site_css' => $largeCss,
            'pages' => [
                [
                    'name' => 'Home',
                    'slug' => 'home',
                    'order' => 0,
                    'sections' => [
                        [
                            'type' => 'hero',
                            'order' => 0,
                            'content' => ['title' => 'Test'],
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(422);
        $errors = $response->json('errors');
        $this->assertArrayHasKey('site_css', $errors);
    }

    /**
     * Test subdomain validation
     */
    public function test_subdomain_validation()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $invalidSubdomains = [
            'UPPERCASE',
            'has spaces',
            'has@special#chars',
            '../../../etc',
            'javascript:alert(1)',
            '-startswithdash',
            'endswithdash-',
        ];

        foreach ($invalidSubdomains as $subdomain) {
            $response = $this->postJson('/api/v1/websites', [
                'name' => 'Test Website',
                'subdomain' => $subdomain,
                'pages' => [
                    [
                        'name' => 'Home',
                        'slug' => 'home',
                        'order' => 0,
                        'sections' => [
                            [
                                'type' => 'hero',
                                'order' => 0,
                                'content' => ['title' => 'Test'],
                            ],
                        ],
                    ],
                ],
            ]);

            $response->assertStatus(422);
            $errors = $response->json('errors');
            $this->assertArrayHasKey('subdomain', $errors, "Subdomain validation failed for: $subdomain");
        }
    }

    /**
     * Test template image rename path traversal prevention
     */
    public function test_template_image_rename_prevents_path_traversal()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $template = \App\Models\Template::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Template',
        ]);

        $maliciousNames = [
            '../../../etc/passwd',
            '../../private/secret.txt',
            'file.php\x00.jpg',
        ];

        foreach ($maliciousNames as $newName) {
            $response = $this->postJson("/api/v1/templates/{$template->id}/rename-image", [
                'oldName' => 'image.jpg',
                'newName' => $newName,
            ]);

            $response->assertStatus(422);
            $this->assertStringContainsString('Invalid filename', $response->json('message'));
        }
    }

    /**
     * Test valid CSS is not modified
     */
    public function test_valid_css_passes_through_sanitizer()
    {
        $validCss = [
            'body { background-color: #333; color: white; }',
            '.container { max-width: 1200px; margin: 0 auto; }',
            '@media (max-width: 768px) { .container { padding: 10px; } }',
            'a:hover { text-decoration: underline; }',
            '.btn { background: linear-gradient(45deg, #333, #666); }',
        ];

        foreach ($validCss as $css) {
            $result = $this->cssSanitizer->sanitize($css);
            // Valid CSS should mostly remain intact (minor formatting changes ok)
            $this->assertNotEmpty($result);
            $this->assertStringContainsString('{', $result);
            $this->assertStringContainsString('}', $result);
        }
    }

    /**
     * Test valid HTML is preserved
     */
    public function test_valid_html_passes_through_sanitizer()
    {
        $validHtml = [
            '<p>This is a paragraph</p>',
            '<h1>Title</h1><p>Content</p>',
            '<a href="https://example.com">Link</a>',
            '<img src="/images/photo.jpg" alt="Photo">',
            '<div class="container"><span>Text</span></div>',
        ];

        foreach ($validHtml as $html) {
            $result = $this->htmlSanitizer->sanitize($html);
            $this->assertNotEmpty($result);
            // Check that basic structure is preserved
            preg_match_all('/<[^>]+>/', $html, $originalTags);
            preg_match_all('/<[^>]+>/', $result, $resultTags);
            $this->assertGreaterThan(0, count($resultTags[0]));
        }
    }

    /**
     * Test security logging
     */
    public function test_security_violations_are_logged()
    {
        Log::shouldReceive('warning')
            ->once()
            ->with(\Mockery::on(function ($message) {
                return str_contains($message, 'Path traversal attempt detected');
            }));

        try {
            $this->pathValidator->validatePath('../../../etc/passwd', '/var/www/html');
        } catch (SecurityException $e) {
            // Expected
        }
    }
}