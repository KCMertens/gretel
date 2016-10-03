<?php

function xpathToBreadthFirst($xpath)
{
    $bfresult;
    // Divide XPath in top-most level, and the rest (its "descendants")
    if (preg_match("/^\/\/?node\[([^\[]*?)((?:node\[|count\().*)\]$/", $xpath, $items)) {
        list(, $topattrs, $descendants) = $items;

        $topcat;
         // Find category of top node
         // CAVEAT: only takes one cat into account and not OR constructions
         if ($topattrs && preg_match("/\@cat=\"([^\"]+)\"/", $topattrs, $toppattrsArray)) {
             $topcat = $toppattrsArray[1];
         }
         // If the top node doesn't have any attributes
         // or if value is not specified, return ALL
         else {
             $topcat = 'ALL';
         }

         // Only continue if there is more than one level
         if ($descendants) {
             // Remove fixed-order nodes, not relevant
             $descendants = preg_replace("/(?:and)?number\(\@begin\).*?\@begin\)/", '', $descendants);

             $depth = 0;
             $children = '';
             $charlength = strlen($descendants);

             // Goes through each character of the string and keeps track of the
             // depth we're in. If the depth is two or more, we don't take those
             // characters into account. Output is $children that contains only
             // nodes from the second level (i.e. "children" of top node)
             for ($pos = 0; $pos < $charlength; ++$pos) {
                 $char = substr($descendants, $pos, 1);

                 if ($char == '[') {
                     ++$depth;
                 }

                 // If we're less than 2 levels deep: keep characters in string
                 if ($depth < 2) {
                     $children .= $char;
                 }

                 // If we're deeper: don't include string, and possibly remove
                 // trailing start node of a deeper level
                 else {
                     $children = preg_replace('/(and )?node$/', '', $children);
                 }

               // Only decrement depth after operations to ensure closing brackets
               // of nodes that are too deep are excluded
                 if ($char == ']') {
                     --$depth;
                 }
             }

             // At the end of the loop depth ought to be zero
             /*
             if ($depth != 0) {
                 // warn("XPath not correct");
             }
             */

            // Check if there is a count present
            // and manipulate the string accordingly, i.e. multiply when necessary
            // e.g. count(node[@pt="n"]) > 1 -> node[@pt="n"] and node[@pt="n"]
             $children = preg_replace_callback("/(count\((.*)\) *> *([1-9]+))/",
              function ($matches) {
                  return $matches[2].str_repeat(' and '.$matches[2], $matches[3]);
              }, $children);

             $dfpatterns = array();

             // Loop through all remaining node[...] matches and extract rel
             // and cat values
             preg_match_all("/node\[([^\]]*)/", $children, $childrenArray);

             foreach ($childrenArray[0] as $childNode) {
                 preg_match("/\@rel=\"([^\"]+)\"/", $childNode, $rel);
                 preg_match("/\@cat=\"([^\"]+)\"/", $childNode, $cat);

                 if (!$cat) {
                     preg_match("/\@pt=\"([^\"]+)\"/", $childNode, $cat);
                 }

                 $dfpattern;

                 // If rel exists, push value (and possibly also cat/pt) to array
                 // CAVEAT: when no rel present, the node will be left out the
                 // breadth-first pattern and therefore the pattern as a whole is
                 // incomplete, and thus not usable
                 if ($rel) {
                     $dfpattern = "$rel[1]%";
                     if ($cat[1]) {
                         $dfpattern .= $cat[1];
                     }
                     array_push($dfpatterns, $dfpattern);
                 }
             }  // end foreach

             if ($dfpatterns) {
                 // Sort array alphabetically
                 sort($dfpatterns);
                 $dfpatternjoin = implode('_', $dfpatterns);
                 $bfresult = $topcat.$dfpatternjoin;
             } else {
                 $bfresult = $topcat;
             }
         }    // end if ($descendants)
         else {
             $bfresult = $topcat;
         }
    } else {
        $bfresult = false;
    }

    return $bfresult;
}

function tokenize($sentence)
{
  // Add space before and after punctuation marks
  $sentence = preg_replace('/([<>\.\,\:\;\?!\(\)\"])/', ' $1 ', $sentence);
  // Deal wth ...
  $sentence = preg_replace("/(\.\s+\.\s+\.)/", ' ... ', $sentence);
  // Delete first and last space(s)
  $sentence = preg_replace('/^\s*(.*?)\s*$/', '$1', $sentence);
  // Change multiple spaces to single space
  $sentence = preg_replace('/\s+/', ' ', $sentence);
  return $sentence;
}

function modifyLemma($parse, $id, $tmp)
{
    $parseloc = "$tmp/$id-pt.xml";
    $output = fopen($parseloc, 'w');
    // Read alpino parse
    $xml = simpledom_load_file($parse);
    // Sort terminal nodes by 'begin' attribute
    $pts = $xml->sortedXPath('//node[@begin and @postag]', '@begin');

    foreach ($pts as $pt) {
        if ($pt != 'let') {
            $lemma = $pt->getAttribute('lemma');
            // Remove _ from lemmas (for compounds) & remove _DIM from lemmas (for diminutives)
            $lemma = preg_replace('/_(DIM)?/', '', $lemma);
            // Add lemma
            $pt->setAttribute('lemma', $lemma);
        }
    }

    $tree = $xml->asXML();
    fwrite($output, $tree);
    fclose($output);

    return $parseloc;
}

function applyCs($xpath) {
  if (strpos($xpath, '@caseinsensitive="yes"') !== false) {
    preg_match_all("/(?<=node\[).*?(?=node\[|\])/", $xpath, $matches);
    foreach ($matches[0] as $match) {
      if (strpos($match, '@caseinsensitive="yes"') !== false) {
        $dummyMatch = preg_replace('/(?: and )?@caseinsensitive="yes"/', '', $match);
          if (strpos($dummyMatch, '@word') !== false || strpos($dummyMatch, '@lemma') !== false) {
            // Wrap attribute in lower-case(), and lower-case the value
            $dummyMatch = preg_replace_callback('/@(word|lemma)="([^"]+)"/', function($matches) {
               return 'lower-case(@'. $matches[1]. ')="'.strtolower($matches[2]).'"';
             }, $dummyMatch);
          }

          $xpath = preg_replace('/'.preg_quote($match, '/').'/', $dummyMatch, $xpath, 1);
      }
    }
  }
  return $xpath;
}

function isSpam($string)
{
  $websiteRegex = '/(?:https?\:\/\/)?[a-zA-Z0-9-.+&@#%?=~_|!:,.;\/\\\]+(?:\.[a-zA-Z]{2,3}){1,2}(\/\S*)?/';

  if (preg_match($websiteRegex, $string) || filter_var($string, FILTER_VALIDATE_EMAIL)) {
    return true;
  }
  return false;
}
