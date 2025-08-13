<?php

namespace USChamber\Chamberlain;

use Craft;
use craft\base\Plugin as BasePlugin;
use craft\events\RegisterTemplateRootsEvent;
use craft\web\View;
use USChamber\Chamberlain\assetbundles\chatbot\Chatbot;
use yii\base\Event;

/**
 * Chamberlain plugin
 *
 * @method static Plugin getInstance()
 */
class Plugin extends BasePlugin
{
    public string $schemaVersion = '1.0.0';

    public static function config(): array
    {
        return [
            'components' => [
                // Define component configs here...
            ],
        ];
    }

    public function init(): void
    {
        parent::init();

        if (Craft::$app->getRequest()->getIsSiteRequest()) {
            $this->controllerNamespace = 'USChamber\Chamberlain\controllers';
        }

        $this->attachEventHandlers();

    }

    private function attachEventHandlers(): void
    {
        Craft::$app->view->hook(
            'chamberlain',
            [$this, 'onRegisterHook']
        );

        Event::on(View::class, View::EVENT_REGISTER_SITE_TEMPLATE_ROOTS, function(RegisterTemplateRootsEvent $e) {
            if (is_dir($baseDir = $this->getBasePath() . DIRECTORY_SEPARATOR . 'templates')) {
                $e->roots[$this->id] = $baseDir;
            }
        });
    }

    public function onRegisterHook(): void
    {
        Craft::$app->getView()->registerAssetBundle(Chatbot::class);
        $pluginConfig = Craft::$app->getConfig()->getConfigFromFile('chamberlain');

        $html = Craft::$app->getView()->renderTemplate(
            '_chamberlain/_chatbot/index',
            [
                'containerElementSelector' => $pluginConfig['chatbot']['containerElementSelector'] ?? '.article-body-right',
                'articleTextSelector' => $pluginConfig['chatbot']['articleTextSelector'] ?? '.article-body-center',
            ]
        );
        Craft::$app->getView()->registerHtml($html);
        // append some html from a template

//        Craft::$app->getView()->registerCssFile('/assets/styles.css');
    }
}
