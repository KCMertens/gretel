<?php

function buildHomeURL()
{
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';

    return $protocol.$_SERVER['HTTP_HOST'].'/'.basename(__DIR__).'/';
}

defined('ROOT_PATH') or define('ROOT_PATH', __DIR__);
defined('HOME_PATH') or define('HOME_PATH', buildHomeURL());

// Whether or not to use an API to retrieve uploaded corpora. If empty, the corpora will need to be defined in the code.
defined('API_URL') or define('API_URL', '');

// === ALPINO SERVER  MODE ===
// Whether or not to use alpino-server instead of starting a local instance
$alpinoServerMode = false;
$alpinoServerAddress = '';
$alpinoServerPort = 0;

// === ALPINO SERVER  MODE ===
// set to 1 when using alpino in server modus
$alpinoServerMode = 1;
$alpinoServerAddress = 'url port';

// === CHANGE PATH TO ALPINO DIRECTORY === //
// Only when $alpinoServerMode = false
$alpinoDirectory = ROOT_PATH.'/parsers/Alpino';

// In the recursive Javascript call, how many sentences to flush each time
$flushLimit = 50;
// Global limit on the max amount of sentences returned
$resultsLimit = 500;
// Global limit on the max amount of sentences returned for analysis
$analysisLimit = 50000;

$cats = array('advp', 'ahi', 'ap', 'conj', 'cp', 'detp', 'du', 'inf', 'list', 'mwu',
    'np', 'oti', 'pp', 'ppart', 'ppres', 'rel', 'smain', 'ssub', 'sv1', 'svan', 'ti', 'top', 'whq', 'whrel', 'whsub', );

$matrixOptions = array(
    array(
        'word' => 'token',
        'case sensitive' => 'cs',
        'lemma' => 'lemma',
    ),
    array(
      'word class' => 'pos',
      'detailed word class' => 'postag',
    ),
    array(
      'optional in search' => 'na',
      'not in search' => 'not',
    ),
);

// BaseX database variables
// REST: all components with < 1mil databases
// === CHANGE MACHINE AND PORTS, AND USER AND PW BELOW (BaseX) === //
$databaseGroups = array(
  'sonar' => array(
    'REST' => array(
      'components' => array(
        'WRPEC', 'WRPEE', 'WRPEF', 'WRPEG', 'WRPEH', 'WRPEI',
        'WRPEK', 'WRPEL', 'WRPPC', 'WRPPD', 'WRPPE', 'WRPPF',
        'WRPPI', 'WRPPJ', 'WRPPK', 'WRUEA', 'WRUED', 'WRUEE',
        'WSUEA', 'WSUTB',
      ),
      'machine' => 'machine',
      'port' => 0000,
    ),
    'WRPEA' => array(
      'machine' => 'machine',
      'port' => 0000,
      'sentences' => 4395094,
    ),
    'WRPEJ' => array(
      'machine' => 'machine',
      'port' => 0000,
      'sentences' => 1354245,
    ),
    'WRPPB' => array(
      'machine' => 'machine',
      'port' => 0000,
      'sentences' => 1709808,
    ),
    'WRPPG' => array(
      'machine' => 'suske',
      'port' => 0000,
      'sentences' => 14973209,
    ),
    'WRPPH' => array(
      'machine' => 'machine',
      'port' => 0000,
      'sentences' => 5475556,
    ),
    'fullName' => 'SoNaR',
    'version' => '1.0',
    'production' => 'written',
    'language' => 'Dutch',
    'multioption' => false,
  ),
  'cgn' => array(
    'components' => array(
      'NA', 'VA', 'NC', 'VC', 'NB', 'VB', 'ND', 'VD',
      'NE', 'VE', 'NF', 'VF', 'NG', 'VG',
      'NH', 'VH', 'VI', 'NI', 'VJ', 'NJ', 'NK', 'VK',
      'NL', 'VL', 'NM', 'VM', 'NN', 'VN',
      'NO', 'VO',
    ),
    'machine' => 'machine',
    'port' => 0000,
    'fullName' => 'Corpus Gesproken Nederlands',
    'version' => '2.0.1',
    'production' => 'spoken',
    'language' => 'Dutch',
    'multioption' => true,
  ),
  'lassy' => array(
    'title' => 'LASSY Small',
    'description' => 'written Dutch - version 1.1',
    'components' => array(
      'DPC', 'WIKI', 'WRPE', 'WRPP', 'WSU',
    ),
    'component_descriptions' => array(
      'DPC' => array(
        'description' => 'Dutch Parallel Corpus',
        'sentences' => 11716,
        'words' => 193029,
      ),
      'WIKI' => array(
        'title' => 'Wikipedia',
        'description' => 'Dutch Wikipedia pages',
        'sentences' => 7341,
        'words' => 83360,
      ),
      'WRPE' => array(
        'title' => 'WR-P-E',
        'description' => 'E-magazines, newsletters, teletext pages, web sites, Wikipedia',
        'sentences' => 14420,
        'words' => 232631,
      ),
      'WRPP' => array(
        'title' => 'WR-P-P',
        'description' => 'Books, brochures, guides and manuals, legal texts, newspapers, periodicals and magazines, policy documents, proceedings, reports, surveys',
        'sentences' => 17691,
        'words' => 281424,
      ),
      'WSU' => array(
        'title' => 'WS-U',
        'description' => 'Auto cues, news scripts, text for the visually impaired',
        'sentences' => 14032,
        'words' => 184611,
      ),
    ),
    'metadata' => array(
      // array(
      // 'field' => /* name of the field */,
      // 'type' => 'text' | 'int' | 'date',
      // 'facet' => 'checkbox' | 'slider' | 'range' | 'dropdown',
      // 'show' => boolean,
      // 'minValue' => int | Date | NULL,
      // 'maxValue' => int | Date | NULL)
    ),
    'machine' => 'machine',
    'port' => 0000,
    'fullName' => 'LASSY Small',
    'version' => '1.1',
    'production' => 'written',
    'language' => 'Dutch',
    'multioption' => true,
  ),
);

$dbuser = 'youruser';
$dbpwd = 'yourpw';
