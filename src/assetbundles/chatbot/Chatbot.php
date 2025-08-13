<?php

namespace USChamber\Chamberlain\assetbundles\chatbot;

use craft\web\AssetBundle;

class Chatbot extends AssetBundle
{
    public function init(): void
    {
        // define the path that your publishable resources live
        $this->sourcePath = '@USChamber/Chamberlain/assetbundles/chatbot/dist';

        // define the relative path to CSS/JS files that should be registered with the page
        // when this asset bundle is registered
        $this->js = [
            'js/chatbot.js',
        ];

        $this->css = [
            'css/chatbot.css',
        ];

        parent::init();
    }
}
